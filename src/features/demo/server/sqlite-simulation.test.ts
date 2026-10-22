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

const connections: Database[] = [];
const directories: string[] = [];
function open(filename = ":memory:") { const db = openSimulationDatabase(filename); connections.push(db); return db; }
function file() { const directory = mkdtempSync(join(tmpdir(), "hui-sqlite-")); directories.push(directory); return join(directory, "simulation.sqlite"); }
afterEach(() => {
  for (const db of connections.splice(0)) db.close();
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true });
});
const command = (type: "seal" | "approve" | "open", recordId = "payout-c3") => ({ type, recordId });

test("SQLite seeds once and retains approvals, redemption and history after reopen", () => {
  const filename = file();
  const first = open(filename);
  expect(readSimulationState(first)).toEqual(createDemoState());
  applySimulationCommand(first, "hanh", command("approve"));
  applySimulationCommand(first, "mai", command("approve"));
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
  expect(() => applySimulationCommand(db, null, command("approve"))).toThrow("Sign in");
  expect(applySimulationCommand(db, "operator", command("approve")).state?.error).not.toBeNull();
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
  applySimulationCommand(a, "hanh", command("approve"));
  expect(applySimulationCommand(b, "hanh", command("approve")).state?.error?.message).toContain("different steward");
  expect(applySimulationCommand(a, "minh", command("open")).release).toBeNull();
  applySimulationCommand(b, "tuan", command("approve"));
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
  expect(readSimulationState(reopened)).toEqual(createDemoState());
  expect(sessionActor(reopened, second)).toBe("operator");
  deleteSession(reopened, second);
  expect(sessionActor(reopened, second)).toBeNull();
});

test("a failed SQLite write rolls back approval and history together", () => {
  const db = open();
  const before = readSimulationState(db);
  db.exec("CREATE TRIGGER deny_test_event BEFORE INSERT ON simulation_events BEGIN SELECT RAISE(ABORT, 'simulated disk write failure'); END;");
  expect(() => applySimulationCommand(db, "hanh", command("approve"))).toThrow("simulated disk write failure");
  expect(readSimulationState(db)).toEqual(before);
});

test("unknown newer schemas fail without resetting existing data", () => {
  const filename = file();
  const db = open(filename);
  applySimulationCommand(db, "hanh", command("approve"));
  db.exec("PRAGMA user_version = 99;");
  expect(() => openSimulationDatabase(filename)).toThrow("newer than this app");
  expect(readSimulationState(db).cycles.find(cycle => cycle.number === 3)?.approvals).toEqual(["hanh"]);
});
