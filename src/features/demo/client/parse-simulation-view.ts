import type { AuditEvent } from "@/features/circle/types";
import { CYCLE_NUMBERS, cycleMetadata } from "@/features/circle/model";
import type { DemoCycle, DemoState } from "../model";
import { isDemoSteward } from "../model";
import { isDemoRole, type SimulationView } from "../simulation-contract";
import { DEMO_ACTORS } from "../model";
import { parseChanges } from "./parse-changes";

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid SQLite response. Refresh data.");
  return value as Record<string, unknown>;
}
function text(value: unknown): string {
  if (typeof value !== "string" || value.length > 1024) throw new Error("Invalid SQLite response. Refresh data.");
  return value;
}
function parseCycle(value: unknown): DemoCycle {
  const item = object(value);
  if (typeof item.number !== "number" || !CYCLE_NUMBERS.some(number => number === item.number) ||
      typeof item.sealed !== "boolean" || typeof item.redeemed !== "boolean" ||
      typeof item.ciphertextBytes !== "number" || !Number.isSafeInteger(item.ciphertextBytes) || item.ciphertextBytes < 0 ||
      !Array.isArray(item.approvals) || item.approvals.length > 2 ||
      !Array.isArray(item.readers) || !item.readers.every(isDemoRole) || !isDemoRole(item.beneficiaryUsername) ||
      typeof item.policyExpiresAt !== "number" || !Number.isSafeInteger(item.policyExpiresAt) ||
      typeof item.policyVersion !== "number" || !Number.isSafeInteger(item.policyVersion) || typeof item.policyRevoked !== "boolean" ||
      !item.approvals.every(actor => isDemoRole(actor) && isDemoSteward(actor)) || new Set(item.approvals).size !== item.approvals.length) {
    throw new Error("Invalid SQLite cycle. Refresh data.");
  }
  const metadata = cycleMetadata(item.number);
  if (item.recordId !== metadata.recordId) throw new Error("Mismatched SQLite cycle. Refresh data.");
  return {
    ...metadata, sealed: item.sealed, redeemed: item.redeemed, ciphertextBytes: item.ciphertextBytes,
    beneficiaryUsername: item.beneficiaryUsername, beneficiary: DEMO_ACTORS.find(actor => actor.id === item.beneficiaryUsername)!.name,
    readers: item.readers.filter(isDemoRole), policyVersion: item.policyVersion, policyExpiresAt: item.policyExpiresAt, policyRevoked: item.policyRevoked,
    sealedAt: item.sealedAt === null ? null : text(item.sealedAt), approvals: item.approvals.filter(isDemoRole),
  };
}
function parseEvent(value: unknown): AuditEvent {
  const event = object(value);
  return { id: text(event.id), at: text(event.at), actor: text(event.actor), action: text(event.action), recordId: text(event.recordId) };
}
export function parseSimulationView(value: unknown): SimulationView {
  const view = object(value);
  if (view.actor === null && view.state === null && view.release === null) return { actor: null, state: null, release: null };
  if (!isDemoRole(view.actor)) throw new Error("Invalid sample session. Sign in again.");
  const source = object(view.state);
  if (!Array.isArray(source.cycles) || source.cycles.length !== 3 || !Array.isArray(source.events) || source.events.length > 50) {
    throw new Error("Invalid SQLite snapshot. Refresh data.");
  }
  const state: DemoState = { cycles: source.cycles.map(parseCycle), events: source.events.map(parseEvent), changes: parseChanges(source.changes), error: null };
  if (new Set(state.cycles.map(cycle => cycle.recordId)).size !== 3) throw new Error("Duplicate SQLite cycle. Refresh data.");
  if (source.error !== null) {
    const error = object(source.error);
    if (error.operation !== "seal" && error.operation !== "policies" && error.operation !== "open" && error.operation !== "redeem") throw new Error("Invalid SQLite operation.");
    state.error = { operation: error.operation, message: text(error.message) };
  }
  if (view.release === null) return { actor: view.actor, state, release: null };
  const release = object(view.release);
  const cycle = state.cycles.find(item => item.number === release.cycle);
  if (!cycle || !cycle.readers.includes(view.actor) || release.amountVnd !== cycle.amountVnd || release.beneficiary !== cycle.beneficiaryUsername) throw new Error("Invalid sample release response.");
  return { actor: view.actor, state, release: { cycle: cycle.number, beneficiary: cycle.beneficiaryUsername, amountVnd: cycle.amountVnd, code: text(release.code) } };
}
