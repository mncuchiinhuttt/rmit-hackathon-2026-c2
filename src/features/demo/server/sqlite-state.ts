import type { Database } from "bun:sqlite";
import { cycleMetadata } from "@/features/circle/model";
import type { AuditEvent } from "@/features/circle/types";
import { DEMO_ACTORS, type DemoRole, type DemoState } from "../model";
import { readChanges, writeChanges } from "./sqlite-changes";

interface CycleRow {
  record_id: string; cycle_number: number; sealed: number; redeemed: number;
  sealed_at: string | null; ciphertext_bytes: number;
  beneficiary_user: DemoRole; policy_version: number; policy_expires_at: number; policy_revoked: number;
}
interface ApprovalRow { record_id: string; actor: DemoRole }
interface EventRow { id: string; at: string; actor: string; action: string; record_id: string }

export function readSimulationState(database: Database): DemoState {
  const approvals = database.query<ApprovalRow, []>("SELECT record_id, actor FROM simulation_approvals ORDER BY rowid").all();
  const readers = database.query<ApprovalRow, []>("SELECT record_id, actor FROM simulation_readers ORDER BY rowid").all();
  const cycles = database.query<CycleRow, []>("SELECT * FROM simulation_cycles ORDER BY cycle_number").all().map(row => ({
    ...cycleMetadata(row.cycle_number), sealed: row.sealed === 1, redeemed: row.redeemed === 1,
    sealedAt: row.sealed_at, ciphertextBytes: row.ciphertext_bytes,
    beneficiaryUsername: row.beneficiary_user, beneficiary: DEMO_ACTORS.find(actor => actor.id === row.beneficiary_user)!.name,
    policyVersion: row.policy_version, policyExpiresAt: row.policy_expires_at, policyRevoked: row.policy_revoked === 1,
    readers: readers.filter(reader => reader.record_id === row.record_id).map(reader => reader.actor),
    approvals: approvals.filter(approval => approval.record_id === row.record_id).map(approval => approval.actor),
  }));
  const events: AuditEvent[] = database.query<EventRow, []>("SELECT * FROM simulation_events ORDER BY rowid DESC LIMIT 50").all().reverse().map(row => ({
    id: row.id, at: row.at, actor: row.actor, action: row.action, recordId: row.record_id,
  }));
  return { cycles, events, changes: readChanges(database), error: null };
}

// Call inside a transaction: state, unique approvals and audit history commit together.
export function writeSimulationState(database: Database, state: DemoState): void {
  const cycleQuery = database.query(`INSERT INTO simulation_cycles VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(record_id) DO UPDATE SET sealed=excluded.sealed, redeemed=excluded.redeemed,
    sealed_at=excluded.sealed_at, ciphertext_bytes=excluded.ciphertext_bytes, beneficiary_user=excluded.beneficiary_user,
    policy_version=excluded.policy_version, policy_expires_at=excluded.policy_expires_at, policy_revoked=excluded.policy_revoked`);
  database.exec("DELETE FROM simulation_readers; DELETE FROM simulation_approvals; DELETE FROM simulation_events;");
  for (const cycle of state.cycles) {
    cycleQuery.run(cycle.recordId, cycle.number, Number(cycle.sealed), Number(cycle.redeemed), cycle.sealedAt, cycle.ciphertextBytes, cycle.beneficiaryUsername, cycle.policyVersion, cycle.policyExpiresAt, Number(cycle.policyRevoked));
    for (const actor of cycle.readers) database.query("INSERT INTO simulation_readers VALUES(?,?)").run(cycle.recordId, actor);
    for (const actor of cycle.approvals) {
      database.query("INSERT INTO simulation_approvals(record_id, actor) VALUES (?, ?)").run(cycle.recordId, actor);
    }
  }
  const eventQuery = database.query("INSERT INTO simulation_events VALUES (?, ?, ?, ?, ?)");
  for (const event of state.events) eventQuery.run(event.id, event.at, event.actor, event.action, event.recordId);
  writeChanges(database, state.changes);
}
