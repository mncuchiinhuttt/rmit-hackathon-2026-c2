import { expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openSimulationDatabase } from "./sqlite-database";
import { readSimulationState } from "./sqlite-state";

test("v1 migration preserves redeemed history and sessions, and changes only an unsealed future turn", () => {
  const directory = mkdtempSync(join(tmpdir(), "hui-migration-"));
  try {
    for (const sealed of [0, 1]) {
      const filename = join(directory, `v1-${sealed}.sqlite`);
      const old = new Database(filename);
      old.exec(`
        CREATE TABLE simulation_cycles(record_id TEXT PRIMARY KEY,cycle_number INTEGER NOT NULL UNIQUE,sealed INTEGER NOT NULL,redeemed INTEGER NOT NULL,sealed_at TEXT,ciphertext_bytes INTEGER NOT NULL) STRICT;
        CREATE TABLE simulation_approvals(record_id TEXT NOT NULL REFERENCES simulation_cycles(record_id),actor TEXT NOT NULL,PRIMARY KEY(record_id,actor)) STRICT;
        CREATE TABLE simulation_events(id TEXT PRIMARY KEY,at TEXT NOT NULL,actor TEXT NOT NULL,action TEXT NOT NULL,record_id TEXT NOT NULL REFERENCES simulation_cycles(record_id)) STRICT;
        CREATE TABLE simulation_sessions(token_hash TEXT PRIMARY KEY,actor TEXT NOT NULL,expires_at INTEGER NOT NULL) STRICT;
        INSERT INTO simulation_cycles VALUES('payout-c1',1,1,1,'old-time',20),('payout-c3',3,1,1,'old-time',20);
        INSERT INTO simulation_approvals VALUES('payout-c1','hanh'),('payout-c1','tuan');
        INSERT INTO simulation_events VALUES('history','old-time','Minh','Demo redemption recorded','payout-c1');
        INSERT INTO simulation_sessions VALUES('existing-hash','hanh',4000000000);
        PRAGMA user_version=1;
      `);
      old.query("INSERT INTO simulation_cycles VALUES('payout-c4',4,?,0,NULL,0)").run(sealed);
      old.close();
      const migrated = openSimulationDatabase(filename);
      try {
        const state = readSimulationState(migrated);
        expect(state.cycles.find(cycle => cycle.number === 1)?.redeemed).toBe(true);
        expect(state.cycles.find(cycle => cycle.number === 1)?.readers).toEqual(["minh"]);
        expect(state.cycles.find(cycle => cycle.number === 4)?.beneficiaryUsername).toBe(sealed ? "minh" : "bao");
        expect(state.events[0].id).toBe("history");
        expect(migrated.query<{ actor: string }, []>("SELECT actor FROM simulation_sessions").get()?.actor).toBe("hanh");
        expect(state.changes).toEqual([]);
      } finally { migrated.close(); }
    }
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
