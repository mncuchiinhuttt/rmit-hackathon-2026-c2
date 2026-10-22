import { expect, test } from "bun:test";
import { mkdtemp, mkdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const projectRoot = resolve(import.meta.dir, "..");

test("real auth wrappers verify ephemeral JWT and DPoP bindings in an isolated cwd", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "hui-auth-boundary-"));
  try {
    await mkdir(join(cwd, "data"), { recursive: true });
    await mkdir(join(cwd, ".cache"), { recursive: true });
    await symlink(resolve(projectRoot, "node_modules"), join(cwd, "node_modules"), "dir");
    await writeFile(join(cwd, "tsconfig.json"), JSON.stringify({
      compilerOptions: { baseUrl: ".", paths: { "@/*": [resolve(projectRoot, "src/*")] } },
    }));

    const script = `
      // Keys are generated in this child; static imports in the parent would share cwd-bound auth state.
      const { SignJWT, calculateJwkThumbprint, exportJWK, generateKeyPair } = await import("jose");
      const { Buffer } = await import("node:buffer");
      const issuerKeys = await generateKeyPair("EdDSA");
      const dpopKeys = await generateKeyPair("ES256");
      const issuerJwk = await exportJWK(issuerKeys.publicKey);
      issuerJwk.kid = "synthetic-ed25519-key";
      issuerJwk.alg = "EdDSA";
      issuerJwk.use = "sig";
      const dpopJwk = await exportJWK(dpopKeys.publicKey);
      const jkt = await calculateJwkThumbprint(dpopJwk, "sha256");
      const issuer = "http://127.0.0.1:8080/realms/hui-rmit26";
      const clientId = "hui-rmit26-client";
      const target = "http://localhost/api/auth-boundary?ignored=1";
      const htu = "http://localhost/api/auth-boundary";
      await Bun.write("data/tidecloak.json", JSON.stringify({
        realm: "hui-rmit26",
        "auth-server-url": "http://127.0.0.1:8080",
        resource: clientId,
        jwk: { keys: [issuerJwk] },
        vendorId: "synthetic-vendor",
        homeOrkUrl: "https://example.invalid",
        "client-origin-auth-http://localhost:3000": "synthetic-origin-signature",
      }));
      await Bun.write(".cache/tide-demo-users.json", JSON.stringify({
        synthetic: { id: "synthetic-subject", tideUserKey: "synthetic-public-key" },
      }));

      // Import after fixture creation in the child so loadTideConfig and demo-user mapping use only temp files.
      const { withClientRole, withRealmRole } = await import("@/features/auth/server/with-auth");
      const now = Math.floor(Date.now() / 1000);
      const issueToken = ({ azp = clientId, exp = now + 300, realmRoles = [], clientRoles = {} } = {}) =>
        new SignJWT({
          azp,
          preferred_username: "synthetic",
          tideuserkey: "synthetic-public-key",
          realm_access: { roles: realmRoles },
          resource_access: Object.fromEntries(Object.entries(clientRoles).map(([id, roles]) => [id, { roles }])),
          cnf: { jkt },
        })
          .setProtectedHeader({ alg: "EdDSA", kid: "synthetic-ed25519-key", typ: "JWT" })
          .setIssuer(issuer)
          .setSubject("synthetic-subject")
          .setIssuedAt(now)
          .setExpirationTime(exp)
          .sign(issuerKeys.privateKey);
      const proofFor = async (token, proofHtu = htu) => {
        const ath = Buffer.from(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token))).toString("base64url");
        return new SignJWT({ htm: "POST", htu: proofHtu, ath, iat: Math.floor(Date.now() / 1000), jti: crypto.randomUUID() })
          .setProtectedHeader({ alg: "ES256", typ: "dpop+jwt", jwk: dpopJwk })
          .sign(dpopKeys.privateKey);
      };
      const request = (token, proof, scheme = "DPoP") => new Request(target, {
        method: "POST",
        headers: {
          origin: "http://localhost",
          authorization: scheme + " " + token,
          ...(proof ? { dpop: proof } : {}),
        },
      });
      const summarize = async (response) => {
        const body = await response.text();
        try { return { status: response.status, code: JSON.parse(body).code }; }
        catch { return { status: response.status }; }
      };
      let authorizedCalls = 0;
      const handler = () => { authorizedCalls++; return new Response("accepted"); };
      const realmRoute = withRealmRole("_tide_decryptor", handler);
      const adminRoute = withClientRole("realm-management", "tide-realm-admin", handler);
      const realmToken = await issueToken({ realmRoles: ["_tide_decryptor"] });
      const realmSuccess = await summarize(await realmRoute(request(realmToken, await proofFor(realmToken))));
      const adminToken = await issueToken({ clientRoles: { "realm-management": ["tide-realm-admin"] } });
      const adminProof = await proofFor(adminToken);
      const adminSuccess = await summarize(await adminRoute(request(adminToken, adminProof)));
      const replay = await summarize(await adminRoute(request(adminToken, adminProof)));
      const missingProof = await summarize(await adminRoute(request(adminToken, undefined)));
      const bearer = await summarize(await adminRoute(request(adminToken, await proofFor(adminToken), "Bearer")));
      const wrongHtu = await summarize(await adminRoute(request(adminToken, await proofFor(adminToken, "http://localhost/other"))));
      const wrongAzpToken = await issueToken({ azp: "another-client", clientRoles: { "realm-management": ["tide-realm-admin"] } });
      const wrongAzp = await summarize(await adminRoute(request(wrongAzpToken, await proofFor(wrongAzpToken))));
      const expiredToken = await issueToken({ exp: now - 1, clientRoles: { "realm-management": ["tide-realm-admin"] } });
      const expired = await summarize(await adminRoute(request(expiredToken, await proofFor(expiredToken))));
      const spoofToken = await issueToken({
        realmRoles: ["tide-realm-admin"],
        clientRoles: { "hui-rmit26-client": ["tide-realm-admin"] },
      });
      const realmRoleSpoof = await summarize(await adminRoute(request(spoofToken, await proofFor(spoofToken))));
      console.log(JSON.stringify({ realmSuccess, adminSuccess, replay, missingProof, bearer, wrongHtu, wrongAzp, expired, realmRoleSpoof, authorizedCalls }));
    `;
    const child = Bun.spawn([process.execPath, "--eval", script], { cwd, stdout: "pipe", stderr: "pipe" });
    const [exitCode, stdout, stderr] = await Promise.all([
      child.exited,
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
    ]);
    expect({ exitCode, stderr }).toEqual({ exitCode: 0, stderr: "" });
    expect(JSON.parse(stdout.trim())).toEqual({
      realmSuccess: { status: 200 },
      adminSuccess: { status: 200 },
      replay: { status: 401, code: "unauthorized" },
      missingProof: { status: 401, code: "unauthorized" },
      bearer: { status: 401, code: "unauthorized" },
      wrongHtu: { status: 401, code: "unauthorized" },
      wrongAzp: { status: 401, code: "unauthorized" },
      expired: { status: 401, code: "unauthorized" },
      realmRoleSpoof: { status: 403, code: "forbidden" },
      authorizedCalls: 2,
    });
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});
