import { expect, test } from "bun:test";
import { mkdtemp, mkdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import type { JWTPayload } from "jose";
import { exportJWK, generateKeyPair } from "jose";
import type { AuthContext } from "@/features/auth/server/identity";
import { storePolicy } from "@/features/releases/server/release-service";

const projectRoot = resolve(import.meta.dir, "../../../../");

async function checkPolicies(operation: string): Promise<unknown> {
  const cwd = await mkdtemp(join(tmpdir(), "hui-policy-test-"));
  try {
    await mkdir(join(cwd, "data"));
    await symlink(join(projectRoot, "node_modules"), join(cwd, "node_modules"), "dir");
    await writeFile(join(cwd, "tsconfig.json"), JSON.stringify({
      compilerOptions: { baseUrl: ".", paths: { "@/*": [join(projectRoot, "src/*")] } },
    }));
    const { publicKey } = await generateKeyPair("EdDSA");
    await writeFile(join(cwd, "data/tidecloak.json"), JSON.stringify({
      realm: "hui-rmit26",
      "auth-server-url": "http://localhost:8080",
      resource: "hui-rmit26-client",
      jwk: { keys: [await exportJWK(publicKey)] },
      vendorId: "synthetic-vendor",
      homeOrkUrl: "https://example.invalid",
      "client-origin-auth-http://localhost:3000": "synthetic-origin-signature",
    }));
    // The real config loader caches cwd-bound state: each scenario gets a separate process.
    const script = `
      const { Buffer } = await import("node:buffer");
      const { Models } = await import("@tideorg/js");
      const { validateSubmittedPolicy } = await import("@/features/releases/server/policy-validation");
      const now = Math.floor(Date.now() / 1000);
      const policyInput = (options = {}) => {
        const expiresAt = options.expiresAt ?? now + 3600;
        const policy = new Models.Policy({
          version: Models.Policy.latestVersion,
          contractId: "RelationshipAttestation:1",
          modelId: ["PolicyEnabledEncryption:1", "PolicyEnabledDecryption:1"],
          keyId: options.keyId ?? "synthetic-vendor",
          approvalType: Models.ApprovalType.IMPLICIT,
          executionType: Models.ExecutionType.PRIVATE,
          params: new Map([
            ["assignmentId", options.assignmentId ?? "payout-c3"],
            ["roles", options.roleText ?? JSON.stringify(["_tide_decryptor"])],
            ["subjectId", "hui-c3-winner"],
            ["subjectType", "Role"],
          ]),
          expiry: BigInt(options.policyExpiry ?? expiresAt),
        });
        // Structure-only validator: authenticity is separately enforced by the ORKs.
        policy.signature = Uint8Array.of(1);
        return {
          recordId: "payout-c3", access: "read", subject: { type: "Role", id: "hui-c3-winner" },
          expiresAt, policyB64: options.policyB64 ?? Buffer.from(policy.toBytes()).toString("base64"),
        };
      };
      const rejection = (input) => {
        try { validateSubmittedPolicy(input); return null; }
        catch (error) { return { status: error.status, code: error.code }; }
      };
      console.log(JSON.stringify((${operation})()));
    `;
    const child = Bun.spawn([process.execPath, "--eval", script], { cwd, stdout: "pipe", stderr: "pipe" });
    const [exitCode, stdout, stderr] = await Promise.all([
      child.exited, new Response(child.stdout).text(), new Response(child.stderr).text(),
    ]);
    expect({ exitCode, stderr }).toEqual({ exitCode: 0, stderr: "" });
    return JSON.parse(stdout.trim()) as unknown;
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
}

const invalidPolicy = { status: 400, code: "invalid_policy" };

test("accepts scoped policy structure but rejects malformed bytes, record tags, roles and vendor", async () => {
  const result = await checkPolicies(`() => {
    const input = policyInput();
    const accepted = validateSubmittedPolicy(input);
    return {
      accepted: { recordId: accepted.recordId, access: accepted.access, subject: accepted.subject,
        expiryMatches: accepted.expiresAt === input.expiresAt, policyMatches: accepted.policyB64 === input.policyB64 },
      invalid: [
        { policyB64: "%%%" }, { assignmentId: "payout-c4" }, { roleText: "not-json" },
        { roleText: JSON.stringify(["tide-realm-admin"]) }, { keyId: "another-vendor" },
      ].map((options) => rejection(policyInput(options))),
    };
  }`);
  expect(result).toEqual({
    accepted: { recordId: "payout-c3", access: "read", subject: { type: "Role", id: "hui-c3-winner" }, expiryMatches: true, policyMatches: true },
    invalid: Array(5).fill(invalidPolicy),
  });
});

test("rejects expired, out-of-range, unsafe, or mismatched policy expiry", async () => {
  const result = await checkPolicies(`() => [
    { expiresAt: now - 1 }, { expiresAt: now + 48 * 60 * 60 + 301 },
    { expiresAt: Number.MAX_SAFE_INTEGER + 1 }, { policyExpiry: now + 3601 },
  ].map((options) => rejection(policyInput(options)))`);
  expect(result).toEqual(Array(4).fill(invalidPolicy));
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
