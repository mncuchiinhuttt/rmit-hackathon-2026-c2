import type { Database } from "bun:sqlite";
import { POLICY_LIFETIME_SECONDS } from "../governance-types";

export function migrateGovernance(database: Database): void {
  database.exec(`
    ALTER TABLE simulation_cycles ADD COLUMN beneficiary_user TEXT NOT NULL DEFAULT 'minh';
    ALTER TABLE simulation_cycles ADD COLUMN policy_version INTEGER NOT NULL DEFAULT 1;
    ALTER TABLE simulation_cycles ADD COLUMN policy_expires_at INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE simulation_cycles ADD COLUMN policy_revoked INTEGER NOT NULL DEFAULT 0 CHECK(policy_revoked IN (0,1));
    CREATE TABLE simulation_readers (
      record_id TEXT NOT NULL REFERENCES simulation_cycles(record_id), actor TEXT NOT NULL,
      PRIMARY KEY(record_id,actor)
    ) STRICT;
    CREATE TABLE simulation_changes (
      id TEXT PRIMARY KEY, record_id TEXT NOT NULL REFERENCES simulation_cycles(record_id),
      kind TEXT NOT NULL CHECK(kind IN ('grant','renew','revoke')), target TEXT,
      proposed_by TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('pending','committed','superseded')),
      base_version INTEGER NOT NULL, created_at TEXT NOT NULL, committed_at TEXT
    ) STRICT;
    CREATE TABLE simulation_change_votes (
      change_id TEXT NOT NULL REFERENCES simulation_changes(id) ON DELETE CASCADE,
      actor TEXT NOT NULL CHECK(actor IN ('hanh','tuan','mai')), PRIMARY KEY(change_id,actor)
    ) STRICT;
    UPDATE simulation_cycles SET beneficiary_user='bao' WHERE cycle_number=4 AND sealed=0;
    INSERT INTO simulation_readers SELECT record_id,'minh' FROM simulation_approvals GROUP BY record_id HAVING count(*)>=2;
    PRAGMA user_version=2;
  `);
  database.query("UPDATE simulation_cycles SET policy_expires_at=?").run(Math.floor(Date.now() / 1000) + POLICY_LIFETIME_SECONDS);
}
