import { ApiError } from "@/lib/server/api-errors";
import { isRecord } from "@/lib/server/guards";
import { readAtomicJson, updateAtomicJson } from "@/lib/server/atomic-json";
import type { AuditEvent } from "@/features/circle/types";
import type { StoredPolicy } from "@/features/releases/types";

export interface StoredRelease {
  ciphertext: string;
  codeHash: string;
  beneficiarySub: string;
  createdAt: string;
  redeemedAt: string | null;
}

export interface ReleaseLedger {
  version: 1;
  releases: Record<string, StoredRelease>;
  policies: StoredPolicy[];
  events: AuditEvent[];
}

const RECORD_IDS: Record<string, true> = {
  "payout-c1": true,
  "payout-c3": true,
  "payout-c4": true,
};
const EMPTY_LEDGER: ReleaseLedger = { version: 1, releases: {}, policies: [], events: [] };
const unavailable = () => new ApiError(503, "data_store_unavailable", "Release data is unavailable.");

function parsePolicy(value: unknown): StoredPolicy {
  if (!isRecord(value) || typeof value.recordId !== "string" || !Object.hasOwn(RECORD_IDS, value.recordId)) throw unavailable();
  if ((value.access !== "read" && value.access !== "write") || typeof value.policyB64 !== "string" || !value.policyB64) throw unavailable();
  if (typeof value.expiresAt !== "number" || !Number.isSafeInteger(value.expiresAt) || typeof value.createdAt !== "string") throw unavailable();
  if (!isRecord(value.subject) || typeof value.subject.id !== "string" || !value.subject.id) throw unavailable();
  if (value.subject.type === "Role" && (value.subject.clientId === undefined || typeof value.subject.clientId === "string")) {
    return {
      recordId: value.recordId,
      access: value.access,
      subject: { type: "Role", id: value.subject.id, ...(typeof value.subject.clientId === "string" ? { clientId: value.subject.clientId } : {}) },
      policyB64: value.policyB64,
      expiresAt: value.expiresAt,
      createdAt: value.createdAt,
    };
  }
  if (value.subject.type === "User") {
    return { recordId: value.recordId, access: value.access, subject: { type: "User", id: value.subject.id }, policyB64: value.policyB64, expiresAt: value.expiresAt, createdAt: value.createdAt };
  }
  if (value.subject.type === "Group") {
    return { recordId: value.recordId, access: value.access, subject: { type: "Group", id: value.subject.id }, policyB64: value.policyB64, expiresAt: value.expiresAt, createdAt: value.createdAt };
  }
  throw unavailable();
}

function parseEvent(value: unknown): AuditEvent {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.at !== "string" || typeof value.actor !== "string" || typeof value.action !== "string" || typeof value.recordId !== "string" || !Object.hasOwn(RECORD_IDS, value.recordId)) throw unavailable();
  return { id: value.id, at: value.at, actor: value.actor, action: value.action, recordId: value.recordId };
}

function parseLedger(value: unknown): ReleaseLedger {
  if (!isRecord(value) || value.version !== 1 || !isRecord(value.releases) || !Array.isArray(value.policies) || !Array.isArray(value.events)) throw unavailable();
  const releases: Record<string, StoredRelease> = {};
  for (const [recordId, item] of Object.entries(value.releases)) {
    if (!Object.hasOwn(RECORD_IDS, recordId) || !isRecord(item) || typeof item.ciphertext !== "string" || !item.ciphertext || item.ciphertext.length > 65_536) throw unavailable();
    if (typeof item.codeHash !== "string" || !/^[a-f0-9]{64}$/.test(item.codeHash) || typeof item.beneficiarySub !== "string" || !item.beneficiarySub) throw unavailable();
    if (typeof item.createdAt !== "string" || !(item.redeemedAt === null || typeof item.redeemedAt === "string")) throw unavailable();
    releases[recordId] = { ciphertext: item.ciphertext, codeHash: item.codeHash, beneficiarySub: item.beneficiarySub, createdAt: item.createdAt, redeemedAt: item.redeemedAt };
  }
  return { version: 1, releases, policies: value.policies.map(parsePolicy), events: value.events.map(parseEvent) };
}

export function readLedger(): Promise<ReleaseLedger> {
  return readAtomicJson(() => EMPTY_LEDGER, parseLedger);
}

export function updateLedger<R>(mutate: (current: ReleaseLedger) => { next: ReleaseLedger; result: R }): Promise<R> {
  return updateAtomicJson(() => EMPTY_LEDGER, parseLedger, mutate);
}

export function appendLedgerEvent(ledger: ReleaseLedger, event: AuditEvent): AuditEvent[] {
  return [...ledger.events, event].slice(-50);
}
