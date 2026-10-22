import { expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const projectRoot = resolve(import.meta.dir, "../../../../");

test("isolated redemption denies unauthorized attempts and atomically consumes one code", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "hui-escrow-test-"));
  const code = "a".repeat(48);
  const codeHash = createHash("sha256").update(code, "utf8").digest("hex");
  try {
    await mkdir(join(cwd, ".cache"), { recursive: true });
    await mkdir(join(cwd, "data"), { recursive: true });
    await writeFile(join(cwd, ".cache", "tide-demo-users.json"), JSON.stringify({ minh: { id: "synthetic-beneficiary", tideUserKey: "synthetic-tide-key" } }));
    await writeFile(join(cwd, "data", "hostless-hui.json"), JSON.stringify({
      version: 1,
      releases: {
        "payout-c3": {
          ciphertext: "synthetic-ciphertext",
          codeHash,
          beneficiarySub: "synthetic-beneficiary",
          createdAt: "2026-01-01T00:00:00.000Z",
          redeemedAt: null,
        },
      },
      policies: [],
      events: [],
    }));
    await writeFile(join(cwd, "tsconfig.json"), JSON.stringify({
      compilerOptions: { baseUrl: ".", paths: { "@/*": [resolve(projectRoot, "src/*")] } },
    }));

    const redeemUrl = pathToFileURL(resolve(projectRoot, "src/features/escrow/server/redeem-service.ts")).href;
    const persistenceUrl = pathToFileURL(resolve(projectRoot, "src/features/releases/server/persistence.ts")).href;
    // Import after the subprocess starts in its own cwd; atomic-json captures cwd at module load.
    const script = `
      const { redeemEscrow } = await import(${JSON.stringify(redeemUrl)});
      const { readLedger } = await import(${JSON.stringify(persistenceUrl)});
      const request = (redemptionCode) => new Request("http://localhost/api/escrow/redeem", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ recordId: "payout-c3", code: redemptionCode }),
      });
      const auth = (sub, realmRoles) => ({
        accessToken: "synthetic-test-token",
        claims: { sub },
        session: { sub, username: "synthetic-user", tideUserKey: "synthetic-key", realmRoles, isSteward: false, canEncrypt: false, canDecrypt: false },
      });
      const statusOf = async (operation) => {
        try { await operation; return null; }
        catch (error) { return { status: error.status, code: error.code }; }
      };
      const roles = ["_tide_decryptor", "hui-c3-winner"];
      const beneficiary = auth("synthetic-beneficiary", roles);
      const wrongBeneficiary = await statusOf(redeemEscrow(request("${code}"), auth("synthetic-other", roles)));
      const missingRole = await statusOf(redeemEscrow(request("${code}"), auth("synthetic-beneficiary", [])));
      const wrongCode = await statusOf(redeemEscrow(request("${"b".repeat(48)}"), beneficiary));
      const outcomes = await Promise.allSettled([
        redeemEscrow(request("${code}"), beneficiary),
        redeemEscrow(request("${code}"), beneficiary),
      ]);
      const successCount = outcomes.filter((result) => result.status === "fulfilled").length;
      const conflicts = outcomes.filter((result) => result.status === "rejected" && result.reason.code === "already_redeemed").length;
      const response = outcomes.find((result) => result.status === "fulfilled")?.value;
      const payload = response ? await response.json() : null;
      const ledger = await readLedger();
      const release = ledger.releases["payout-c3"];
      await Bun.write("data/hostless-hui.json", "{");
      const corruption = await statusOf(readLedger());
      console.log(JSON.stringify({
        wrongBeneficiary,
        missingRole,
        wrongCode,
        successCount,
        conflicts,
        redeemed: payload?.redeemed === true && payload?.paid === true && payload?.synthetic === true,
        eventCount: ledger.events.length,
        consumed: typeof release.redeemedAt === "string",
        corruption,
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
      wrongBeneficiary: { status: 403, code: "forbidden" },
      missingRole: { status: 403, code: "release_roles_required" },
      wrongCode: { status: 403, code: "invalid_code" },
      successCount: 1,
      conflicts: 1,
      redeemed: true,
      eventCount: 1,
      consumed: true,
      corruption: { status: 503, code: "data_store_unavailable" },
    });
    expect(await readFile(join(cwd, "data", "hostless-hui.json"), "utf8")).toBe("{");
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});
