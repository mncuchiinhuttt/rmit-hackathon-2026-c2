import { Buffer } from "node:buffer";
import { Models } from "@tideorg/js";
import { ApiError } from "@/lib/server/api-errors";
import { hasOnlyKeys, isRecord } from "@/lib/server/guards";
import { getMappedDemoUser } from "@/features/auth/server/demo-users";
import { CYCLE_NUMBERS, cycleMetadata } from "@/features/circle/model";
import type { GrantAccess, GrantSubject, StoredPolicy } from "@/features/releases/types";
import { loadTideConfig } from "@/features/auth/server/tide-config";

const CONTRACT_ID = "RelationshipAttestation:1";
const MODEL_IDS = ["PolicyEnabledEncryption:1", "PolicyEnabledDecryption:1"];
const LIFETIME_LIMIT_SECONDS = 48 * 60 * 60 + 300;

type ParsedPolicy = InstanceType<typeof Models.Policy>;

function invalidPolicy(): ApiError {
  return new ApiError(400, "invalid_policy", "The signed policy does not match the requested release grant.");
}

function requestedSubject(value: unknown, access: GrantAccess, recordId: string): GrantSubject {
  const metadata = CYCLE_NUMBERS.map(cycleMetadata).find((cycle) => cycle.recordId === recordId);
  if (!metadata || !isRecord(value) || typeof value.id !== "string") throw invalidPolicy();
  if (access === "read" && hasOnlyKeys(value, ["type", "id"]) && value.type === "Role" && value.id === metadata.releaseRole) {
    return { type: "Role", id: metadata.releaseRole };
  }
  if (access === "write" && hasOnlyKeys(value, ["type", "id"]) && value.type === "User") {
    const escrowUser = getMappedDemoUser("bao");
    if (!escrowUser.tideUserKey || value.id !== escrowUser.tideUserKey) throw invalidPolicy();
    return { type: "User", id: escrowUser.tideUserKey };
  }
  throw invalidPolicy();
}

function decodePolicy(policyB64: string): Uint8Array {
  if (policyB64.length > 65_536 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(policyB64)) throw invalidPolicy();
  const bytes = Buffer.from(policyB64, "base64");
  if (bytes.length === 0 || bytes.toString("base64") !== policyB64) throw invalidPolicy();
  return bytes;
}

function parsedParameter(policy: ParsedPolicy, key: string): string {
  try {
    return policy.params.getParameter<string>(key);
  } catch {
    throw invalidPolicy();
  }
}

function policyRoles(policy: ParsedPolicy, expectedRole: string): void {
  const roleText = parsedParameter(policy, "roles");
  let parsed: unknown;
  try {
    parsed = JSON.parse(roleText) as unknown;
  } catch {
    throw invalidPolicy();
  }
  if (!Array.isArray(parsed) || parsed.length !== 1 || parsed[0] !== expectedRole) throw invalidPolicy();
  const parameterNames = [...policy.params.entries.keys()].sort();
  if (parameterNames.join("|") !== "assignmentId|roles|subjectId|subjectType") throw invalidPolicy();
}

export function validateSubmittedPolicy(value: unknown): StoredPolicy {
  if (!isRecord(value) || !hasOnlyKeys(value, ["recordId", "access", "subject", "policyB64", "expiresAt"])) throw invalidPolicy();
  if (typeof value.recordId !== "string" || !CYCLE_NUMBERS.some((number) => cycleMetadata(number).recordId === value.recordId)) throw invalidPolicy();
  if ((value.access !== "read" && value.access !== "write") || typeof value.policyB64 !== "string") throw invalidPolicy();
  const access = value.access as GrantAccess;
  const subject = requestedSubject(value.subject, access, value.recordId);
  if (typeof value.expiresAt !== "number" || !Number.isSafeInteger(value.expiresAt)) throw invalidPolicy();
  const now = Math.floor(Date.now() / 1000);
  if (value.expiresAt <= now || value.expiresAt > now + LIFETIME_LIMIT_SECONDS) throw invalidPolicy();

  let policy: ParsedPolicy;
  try {
    policy = Models.Policy.from(decodePolicy(value.policyB64));
  } catch {
    throw invalidPolicy();
  }

  const expectedRole = access === "read" ? "_tide_decryptor" : "_tide_encryptor";
  const expectedSubjectType = subject.type;
  if (policy.contractId !== CONTRACT_ID || policy.modelIds.length !== MODEL_IDS.length || !MODEL_IDS.every((id, index) => policy.modelIds[index] === id)) throw invalidPolicy();
  if (policy.keyId !== loadTideConfig().vendorId || policy.approvalType !== Models.ApprovalType.IMPLICIT || policy.executionType !== Models.ExecutionType.PRIVATE) throw invalidPolicy();
  if (parsedParameter(policy, "assignmentId") !== value.recordId || parsedParameter(policy, "subjectType") !== expectedSubjectType || parsedParameter(policy, "subjectId") !== subject.id) throw invalidPolicy();
  policyRoles(policy, expectedRole);
  if (policy.expiry === undefined || policy.expiry !== BigInt(value.expiresAt)) throw invalidPolicy();
  if (!(policy.signature instanceof Uint8Array) || policy.signature.byteLength === 0) throw invalidPolicy();

  // Models.Policy.from parses bytes and checks signature presence only. The ORKs, not this API,
  // cryptographically verify the VVK signature when a Tide operation uses the policy.
  return {
    recordId: value.recordId,
    access,
    subject,
    policyB64: value.policyB64,
    expiresAt: value.expiresAt,
    createdAt: new Date().toISOString(),
  };
}
