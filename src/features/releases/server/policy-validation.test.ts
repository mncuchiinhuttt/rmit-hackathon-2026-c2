import { expect, test } from "bun:test";
import { Buffer } from "node:buffer";
import type { JWTPayload } from "jose";
import { Models } from "@tideorg/js";
import type { AuthContext } from "@/features/auth/server/identity";
import { storePolicy } from "@/features/releases/server/release-service";
import { validateSubmittedPolicy } from "@/features/releases/server/policy-validation";

interface PolicyOptions {
  expiresAt?: number;
  policyExpiry?: number;
  assignmentId?: string;
  roleText?: string;
  policyB64?: string;
}

function policyBytes(expiry: number, assignmentId: string, roleText: string): string {
  const policy = new Models.Policy({
    version: Models.Policy.latestVersion,
    contractId: "RelationshipAttestation:1",
    modelId: ["PolicyEnabledEncryption:1", "PolicyEnabledDecryption:1"],
    keyId: "synthetic-vendor",
    approvalType: Models.ApprovalType.IMPLICIT,
    executionType: Models.ExecutionType.PRIVATE,
    params: new Map([
      ["assignmentId", assignmentId],
      ["roles", roleText],
      ["subjectId", "hui-c3-winner"],
      ["subjectType", "Role"],
    ]),
    expiry: BigInt(expiry),
  });
  policy.signature = Uint8Array.of(1);
  return Buffer.from(policy.toBytes()).toString("base64");
}

function policyInput(options: PolicyOptions = {}): Record<string, unknown> {
  const expiresAt = options.expiresAt ?? Math.floor(Date.now() / 1000) + 3600;
  return {
    recordId: "payout-c3",
    access: "read",
    subject: { type: "Role", id: "hui-c3-winner" },
    expiresAt,
    policyB64: options.policyB64 ?? policyBytes(
      options.policyExpiry ?? expiresAt,
      options.assignmentId ?? "payout-c3",
      options.roleText ?? JSON.stringify(["_tide_decryptor"]),
    ),
  };
}

function expectInvalidPolicy(value: unknown): void {
  let caught: unknown;
  try {
    validateSubmittedPolicy(value);
  } catch (error) {
    caught = error;
  }
  expect(caught).toMatchObject({ status: 400, code: "invalid_policy" });
}

test("rejects malformed policy bytes, wrong record tags, and malformed role parameters", () => {
  expectInvalidPolicy(policyInput({ policyB64: "%%%" }));
  expectInvalidPolicy(policyInput({ assignmentId: "payout-c4" }));
  expectInvalidPolicy(policyInput({ roleText: "not-json" }));
  expectInvalidPolicy(policyInput({ roleText: JSON.stringify(["tide-realm-admin"]) }));
});

test("rejects expired, out-of-range, unsafe, or mismatched policy expiry", () => {
  const now = Math.floor(Date.now() / 1000);
  expectInvalidPolicy(policyInput({ expiresAt: now - 1, policyB64: "%%%" }));
  expectInvalidPolicy(policyInput({ expiresAt: now + 48 * 60 * 60 + 301, policyB64: "%%%" }));
  expectInvalidPolicy(policyInput({ expiresAt: Number.MAX_SAFE_INTEGER + 1, policyB64: "%%%" }));
  expectInvalidPolicy(policyInput({ policyExpiry: now + 3601 }));
});

test("denies policy storage to an unprivileged service caller before parsing its body", async () => {
  const auth: AuthContext = {
    accessToken: "synthetic-test-token",
    claims: { sub: "synthetic-unprivileged-user" } as JWTPayload,
    session: {
      sub: "synthetic-unprivileged-user",
      username: "synthetic-user",
      tideUserKey: "synthetic-public-key",
      realmRoles: [],
      isSteward: false,
      canEncrypt: false,
      canDecrypt: false,
    },
  };
  const request = new Request("http://localhost/api/policies", { method: "POST", body: "not-json" });
  await expect(storePolicy(request, auth)).rejects.toMatchObject({ status: 403, code: "forbidden" });
});
