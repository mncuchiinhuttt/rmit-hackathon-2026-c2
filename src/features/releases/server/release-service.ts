import { randomUUID } from "node:crypto";
import { ApiError, jsonResponse } from "@/lib/server/api-errors";
import { requireJsonObject, readJsonBody } from "@/lib/server/request-body";
import type { AuthContext } from "@/features/auth/server/identity";
import { getMappedDemoUser } from "@/features/auth/server/demo-users";
import { CYCLE_NUMBERS, cycleMetadata } from "@/features/circle/model";
import type { CycleSummary, AuditEvent } from "@/features/circle/types";
import type { ReleaseArtifact, SealingPayload, StoredPolicy } from "@/features/releases/types";
import { appendLedgerEvent, readLedger, updateLedger } from "@/features/releases/server/persistence";
import { validateSubmittedPolicy } from "@/features/releases/server/policy-validation";
import { recordIdFromQuery, parseRecordId } from "@/features/releases/server/record-id";

function cycleSummary(recordId: string, ciphertext: string | null, redeemedAt: string | null, sealedAt: string | null): CycleSummary {
  const metadata = CYCLE_NUMBERS.map(cycleMetadata).find((cycle) => cycle.recordId === recordId);
  if (!metadata) throw new ApiError(400, "invalid_record_id", "Choose a seeded payout record.");
  return {
    ...metadata,
    sealed: ciphertext !== null,
    redeemed: redeemedAt !== null,
    ciphertextBytes: ciphertext === null ? 0 : new TextEncoder().encode(ciphertext).byteLength,
    sealedAt,
  };
}

function event(auth: AuthContext, action: string, recordId: string): AuditEvent {
  return { id: randomUUID(), at: new Date().toISOString(), actor: auth.session.username, action, recordId };
}

export async function getPayout(request: Request): Promise<Response> {
  const recordId = recordIdFromQuery(request);
  const ledger = await readLedger();
  const release = ledger.releases[recordId];
  const policies = ledger.policies.filter((policy) => policy.recordId === recordId);
  const artifact: ReleaseArtifact = {
    cycle: cycleSummary(recordId, release?.ciphertext ?? null, release?.redeemedAt ?? null, release?.createdAt ?? null),
    ciphertext: release?.ciphertext ?? null,
    readPolicy: policies.find((policy) => policy.access === "read") ?? null,
    writePolicy: policies.find((policy) => policy.access === "write") ?? null,
  };
  return jsonResponse(artifact);
}

export async function getPolicies(request: Request): Promise<Response> {
  const recordId = recordIdFromQuery(request);
  const ledger = await readLedger();
  const policies: StoredPolicy[] = ledger.policies.filter((policy) => policy.recordId === recordId);
  return jsonResponse(policies);
}

export async function storePolicy(request: Request, auth: AuthContext): Promise<Response> {
  if (!auth.session.isSteward) throw new ApiError(403, "forbidden", "This action is not permitted.");
  const body = requireJsonObject(await readJsonBody(request));
  const stored = validateSubmittedPolicy(body);
  await updateLedger((ledger) => {
    if (ledger.releases[stored.recordId]) {
      throw new ApiError(409, "release_already_sealed", "A sealed release policy cannot be replaced.");
    }
    const now = Math.floor(Date.now() / 1000);
    const existingIndex = ledger.policies.findIndex((policy) => policy.recordId === stored.recordId && policy.access === stored.access);
    if (existingIndex >= 0 && ledger.policies[existingIndex].expiresAt > now) {
      throw new ApiError(409, "policy_exists", "A valid policy for this record and access level already exists.");
    }
    const policies = [...ledger.policies];
    if (existingIndex >= 0) policies.splice(existingIndex, 1, stored);
    else policies.push(stored);
    const next = { ...ledger, policies, events: appendLedgerEvent(ledger, event(auth, `policy_${stored.access}_stored`, stored.recordId)) };
    return { next, result: undefined };
  });
  return jsonResponse({ policy: stored, signature: { bytesPresent: true, cryptographicVerification: "delegated_to_ork" } }, 201);
}

function parseSealingPayload(value: unknown): SealingPayload {
  const body = requireJsonObject(value);
  if (Object.keys(body).length !== 3 || !Object.keys(body).every((key) => ["recordId", "ciphertext", "codeHash"].includes(key))) {
    throw new ApiError(400, "invalid_request", "The release payload is invalid.");
  }
  const recordId = parseRecordId(body.recordId);
  if (typeof body.ciphertext !== "string" || body.ciphertext.length === 0 || new TextEncoder().encode(body.ciphertext).byteLength > 60 * 1024) {
    throw new ApiError(400, "invalid_ciphertext", "The encrypted release payload is invalid.");
  }
  if (typeof body.codeHash !== "string" || !/^[a-fA-F0-9]{64}$/.test(body.codeHash)) {
    throw new ApiError(400, "invalid_code_hash", "The release code hash must be SHA-256 hex.");
  }
  return { recordId, ciphertext: body.ciphertext, codeHash: body.codeHash.toLowerCase() };
}

export async function sealPayout(request: Request, auth: AuthContext): Promise<Response> {
  if (auth.session.username !== "bao" || !auth.session.canEncrypt) {
    throw new ApiError(403, "forbidden", "This action is not permitted.");
  }
  const payload = parseSealingPayload(await readJsonBody(request));
  const metadata = CYCLE_NUMBERS.map(cycleMetadata).find((cycle) => cycle.recordId === payload.recordId);
  if (!metadata) throw new ApiError(400, "invalid_record_id", "Choose a seeded payout record.");
  const beneficiary = getMappedDemoUser(metadata.beneficiaryUsername);
  const now = Math.floor(Date.now() / 1000);
  await updateLedger((ledger) => {
    if (ledger.releases[payload.recordId]) throw new ApiError(409, "release_already_sealed", "This payout record has already been sealed.");
    for (const access of ["read", "write"] as const) {
      if (!ledger.policies.some((policy) => policy.recordId === payload.recordId && policy.access === access && policy.expiresAt > now)) {
        throw new ApiError(409, "release_policy_missing", "Both active signed policies must be stored before sealing.");
      }
    }
    const release = {
      ciphertext: payload.ciphertext,
      codeHash: payload.codeHash,
      beneficiarySub: beneficiary.id,
      createdAt: new Date().toISOString(),
      redeemedAt: null,
    };
    const next = {
      ...ledger,
      releases: { ...ledger.releases, [payload.recordId]: release },
      events: appendLedgerEvent(ledger, event(auth, "release_sealed_synthetic", payload.recordId)),
    };
    return { next, result: undefined };
  });
  return jsonResponse({ recordId: payload.recordId, sealed: true, synthetic: true }, 201);
}
