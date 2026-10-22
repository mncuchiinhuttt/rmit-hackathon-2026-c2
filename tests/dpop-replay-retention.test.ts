import { expect, test } from "bun:test";
import { mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const projectRoot = resolve(import.meta.dir, "..");

test("retains a signed future-iat DPoP jti through the proof's full validity window", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "hui-dpop-replay-"));
  try {
    await symlink(resolve(projectRoot, "node_modules"), join(cwd, "node_modules"), process.platform === "win32" ? "junction" : "dir");
    await writeFile(join(cwd, "tsconfig.json"), JSON.stringify({
      compilerOptions: { baseUrl: ".", paths: { "@/*": [resolve(projectRoot, "src/*")] } },
    }));
    const script = `
      // The child owns its clock and module state so replay retention cannot affect other tests.
      const { SignJWT, calculateJwkThumbprint, exportJWK, generateKeyPair } = await import("jose");
      const { Buffer } = await import("node:buffer");
      const { DpopError, MemoryJtiStore } = await import("@/features/auth/server/dpop-primitives");
      const { verifyDpop } = await import("@/features/auth/server/verify-dpop");
      const keys = await generateKeyPair("ES256");
      const jwk = await exportJWK(keys.publicKey);
      const jkt = await calculateJwkThumbprint(jwk, "sha256");
      const accessToken = "synthetic-access-token-for-dpop-test";
      const start = Date.now();
      const futureIat = Math.floor(start / 1000) + 240;
      const ath = Buffer.from(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(accessToken))).toString("base64url");
      const proof = await new SignJWT({ htm: "POST", htu: "http://localhost/api/replay", ath, iat: futureIat, jti: "synthetic-future-iat-jti" })
        .setProtectedHeader({ alg: "ES256", typ: "dpop+jwt", jwk })
        .sign(keys.privateKey);
      const request = {
        url: "http://localhost/api/replay?ignored=1",
        method: "POST",
        headers: new Headers({ authorization: "DPoP " + accessToken, dpop: proof }),
      };
      const store = new MemoryJtiStore();
      const claims = { cnf: { jkt } };
      const initialNow = Date.now;
      Date.now = () => start;
      await verifyDpop(request, accessToken, claims, { jtiStore: store, trustForwardedHeaders: false });
      const advancedNow = start + 305_000;
      Date.now = () => advancedNow;
      let replayError = null;
      try {
        await verifyDpop(request, accessToken, claims, { jtiStore: store, trustForwardedHeaders: false });
      } catch (error) {
        replayError = error instanceof DpopError ? { name: error.name, message: error.message } : { name: "unexpected-error" };
      } finally {
        Date.now = initialNow;
      }
      console.log(JSON.stringify({
        firstProofAccepted: true,
        elapsedMs: advancedNow - start,
        withinProofWindow: Math.abs(advancedNow / 1000 - futureIat) <= 300,
        replayError,
      }));
    `;
    const child = Bun.spawn([process.execPath, "--eval", script], { cwd, stdout: "pipe", stderr: "pipe" });
    const [exitCode, stdout, stderr] = await Promise.all([
      child.exited,
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
    ]);
    expect({ exitCode, stderr }).toEqual({ exitCode: 0, stderr: "" });
    expect(JSON.parse(stdout.trim())).toEqual({
      firstProofAccepted: true,
      elapsedMs: 305_000,
      withinProofWindow: true,
      replayError: { name: "DpopError", message: "DPoP proof jti already used — replay." },
    });
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});
