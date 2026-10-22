import type { Database } from "bun:sqlite";
import type { DemoChange } from "../governance-types";
import type { DemoRole } from "../model";

interface ChangeRow {
  id: string; record_id: string; kind: DemoChange["kind"]; target: DemoRole | null;
  proposed_by: DemoRole; status: DemoChange["status"]; base_version: number; created_at: string; committed_at: string | null;
}
export function readChanges(database: Database): DemoChange[] {
  const votes = database.query<{ change_id: string; actor: DemoRole }, []>("SELECT * FROM simulation_change_votes ORDER BY rowid").all();
  return database.query<ChangeRow, []>("SELECT * FROM simulation_changes ORDER BY rowid").all().map(row => ({
    id: row.id, recordId: row.record_id, kind: row.kind, target: row.target,
    proposedBy: row.proposed_by, status: row.status, baseVersion: row.base_version,
    createdAt: row.created_at, committedAt: row.committed_at,
    approvals: votes.filter(vote => vote.change_id === row.id).map(vote => vote.actor),
  }));
}
export function writeChanges(database: Database, changes: DemoChange[]): void {
  database.exec("DELETE FROM simulation_change_votes; DELETE FROM simulation_changes;");
  for (const change of changes) {
    database.query("INSERT INTO simulation_changes VALUES(?,?,?,?,?,?,?,?,?)").run(change.id, change.recordId, change.kind, change.target, change.proposedBy, change.status, change.baseVersion, change.createdAt, change.committedAt);
    for (const actor of change.approvals) database.query("INSERT INTO simulation_change_votes VALUES(?,?)").run(change.id, actor);
  }
}
