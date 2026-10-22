import { afterEach, expect, test } from "bun:test";
import type { Database } from "bun:sqlite";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { openSimulationDatabase } from "./sqlite-database";
import { applySimulationCommand, simulationView } from "./simulation-service";
import { createSession, deleteSession, sessionActor, sessionCookie } from "./simulation-sessions";
import { readSimulationState } from "./sqlite-state";
import { createDemoState } from "../model";
import type { DemoRole } from "../model";

const connections: Database[] = [];
const directories: string[] = [];
function open(filename = ":memory:") { const db = openSimulationDatabase(filename); connections.push(db); return db; }
function file() { const directory = mkdtempSync(join(tmpdir(), "hui-sqlite-")); directories.push(directory); return join(directory, "simulation.sqlite"); }
afterEach(() => {
  for (const db of connections.splice(0)) db.close();
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true });
});
const command = (type: "seal" | "open", recordId = "payout-c3") => ({ type, recordId });
function approve(db: Database, actor: DemoRole, recordId = "payout-c3") {
  const state = readSimulationState(db);
  const recipient = state.cycles.find(cycle => cycle.recordId === recordId)!.beneficiaryUsername as DemoRole;
  const pending = state.changes.find(change => change.recordId === recordId && change.kind === "grant" && change.target === recipient && change.status === "pending");
  const proposed = pending ? state : applySimulationCommand(db, recipient, { type: "propose", recordId, kind: "grant", target: recipient }).state!;
  return applySimulationCommand(db, actor, { type: "vote", requestId: pending?.id ?? proposed.changes.at(-1)!.id });
}

test("SQLite seeds once and retains approvals, redemption and history after reopen", () => {
  const filename = file();
  const first = open(filename);
  expect(readSimulationState(first).cycles.map(cycle => cycle.recordId)).toEqual(createDemoState().cycles.map(cycle => cycle.recordId));
  approve(first, "hanh");
  approve(first, "mai");
  const opened = applySimulationCommand(first, "minh", command("open"));
  expect(opened.release?.code).toBe("DEMO-C3-SAMPLE-CODE");
  applySimulationCommand(first, "minh", { type: "redeem", recordId: "payout-c3", code: opened.release!.code });
  first.close();
  const second = open(filename);
  const state = readSimulationState(second);
  expect(state.cycles.find(cycle => cycle.number === 3)?.approvals).toEqual(["hanh", "mai"]);
  expect(state.cycles.find(cycle => cycle.number === 3)?.redeemed).toBe(true);
  expect(state.events.at(-1)?.action).toBe("Demo redemption recorded");
});

test("SQLite service enforces signed-out and wrong-role denials, including Operator reset", () => {
  const db = open();
  expect(simulationView(db, null).state).toBeNull();
  expect(() => applySimulationCommand(db, null, command("open"))).toThrow("Sign in");
  expect(approve(db, "operator").state?.error).not.toBeNull();
  expect(applySimulationCommand(db, "minh", command("seal", "payout-c4")).state?.error).not.toBeNull();
  for (const actor of ["bao", "hanh", "tuan", "mai", "operator"] as const) {
    expect(applySimulationCommand(db, actor, command("open", "payout-c1")).release).toBeNull();
  }
  expect(() => applySimulationCommand(db, "hanh", { type: "reset" })).toThrow("Only the sample Operator");
});

test("separate SQLite connections see fresh cycle state and never count one steward twice", () => {
  const filename = file();
  const a = open(filename);
  const b = open(filename);
  approve(a, "hanh");
  expect(approve(b, "hanh").state?.error?.message).toContain("different steward");
  expect(applySimulationCommand(a, "minh", command("open")).release).toBeNull();
  approve(b, "tuan");
  expect(applySimulationCommand(a, "minh", command("open")).release).not.toBeNull();
  expect(applySimulationCommand(b, "minh", command("open", "payout-c4")).release).toBeNull();
  expect(a.query<{ total: number }, []>("SELECT count(*) AS total FROM simulation_approvals WHERE record_id='payout-c3'").get()?.total).toBe(2);
});

test("SQLite redemption rejects wrong codes and records exactly one redemption", () => {
  const db = open();
  const redeem = { type: "redeem" as const, recordId: "payout-c1", code: "DEMO-C1-SAMPLE-CODE" };
  expect(() => applySimulationCommand(db, "minh", { ...redeem, code: "wrong" })).toThrow("not accepted");
  expect(applySimulationCommand(db, "minh", redeem).state?.error).toBeNull();
  expect(applySimulationCommand(db, "minh", redeem).state?.error?.message).toContain("already been redeemed");
  expect(readSimulationState(db).events.filter(event => event.action === "Demo redemption recorded")).toHaveLength(1);
  expect(applySimulationCommand(db, "minh", command("open", "payout-c1")).release?.code).toBe("");
});

test("sample sessions are opaque, persisted, rotated and revocable; reset preserves sessions", () => {
  const filename = file();
  const db = open(filename);
  const first = createSession(db, "minh");
  expect(sessionActor(db, first)).toBe("minh");
  expect(sessionActor(db, "minh")).toBeNull();
  expect(db.query<{ token_hash: string }, []>("SELECT token_hash FROM simulation_sessions").get()?.token_hash).not.toBe(first);
  const second = createSession(db, "operator", first);
  expect(sessionActor(db, first)).toBeNull();
  expect(sessionCookie(second, false)).toContain("HttpOnly; SameSite=Strict");
  db.close();
  const reopened = open(filename);
  expect(sessionActor(reopened, second)).toBe("operator");
  applySimulationCommand(reopened, "bao", command("seal", "payout-c4"));
  applySimulationCommand(reopened, "operator", { type: "reset" });
  expect(readSimulationState(reopened).cycles.map(cycle => [cycle.recordId, cycle.redeemed, cycle.approvals])).toEqual(createDemoState().cycles.map(cycle => [cycle.recordId, cycle.redeemed, cycle.approvals]));
  expect(readSimulationState(reopened).changes).toEqual([]);
  expect(sessionActor(reopened, second)).toBe("operator");
  deleteSession(reopened, second);
  expect(sessionActor(reopened, second)).toBeNull();
});

test("a failed SQLite write rolls back approval and history together", () => {
  const db = open();
  applySimulationCommand(db, "minh", { type: "propose", recordId: "payout-c3", kind: "grant", target: "minh" });
  const before = readSimulationState(db);
  db.exec("CREATE TRIGGER deny_test_event BEFORE INSERT ON simulation_events BEGIN SELECT RAISE(ABORT, 'simulated disk write failure'); END;");
  expect(() => approve(db, "hanh")).toThrow("simulated disk write failure");
  expect(readSimulationState(db)).toEqual(before);
});

test("unknown newer schemas fail without resetting existing data", () => {
  const filename = file();
  const db = open(filename);
  approve(db, "hanh");
  db.exec("PRAGMA user_version = 99;");
  expect(() => openSimulationDatabase(filename)).toThrow("newer than this app");
  expect(readSimulationState(db).changes.at(-1)?.approvals).toEqual(["hanh"]);
});

test("persisted expiry, renewal and revocation govern fresh open requests on the server", () => {
  const db = open();
  const original = readSimulationState(db).cycles.find(cycle => cycle.number === 1)!;
  const before = applySimulationCommand(db, "minh", command("open", "payout-c1"));
  expect(before.release?.code).toBe("DEMO-C1-SAMPLE-CODE");
  const expiredAt = new Date(original.policyExpiresAt * 1000).toISOString();
  expect(applySimulationCommand(db, "minh", command("open", "payout-c1"), expiredAt).state?.error?.message).toContain("expired");
  const renew = applySimulationCommand(db, "minh", { type: "propose", recordId: "payout-c1", kind: "renew", target: null }, expiredAt).state!.changes.at(-1)!;
  applySimulationCommand(db, "hanh", { type: "vote", requestId: renew.id }, expiredAt);
  expect(applySimulationCommand(db, "minh", command("open", "payout-c1"), expiredAt).release).toBeNull();
  applySimulationCommand(db, "tuan", { type: "vote", requestId: renew.id }, expiredAt);
  expect(applySimulationCommand(db, "minh", command("open", "payout-c1"), expiredAt).release?.code).toBe(before.release?.code);
  const revoke = applySimulationCommand(db, "operator", { type: "propose", recordId: "payout-c1", kind: "revoke", target: null }, expiredAt).state!.changes.at(-1)!;
  applySimulationCommand(db, "hanh", { type: "vote", requestId: revoke.id }, expiredAt);
  applySimulationCommand(db, "mai", { type: "vote", requestId: revoke.id }, expiredAt);
  expect(applySimulationCommand(db, "minh", command("open", "payout-c1"), expiredAt).release).toBeNull();
  expect(readSimulationState(db).cycles.find(cycle => cycle.number === 1)?.readers).toEqual([]);
});
