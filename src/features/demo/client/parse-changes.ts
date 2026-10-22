import { isDemoRole } from "../simulation-contract";
import type { DemoChange } from "../governance-types";
import { isDemoSteward } from "../model";

export function parseChanges(value: unknown): DemoChange[] {
  if (!Array.isArray(value) || value.length > 50) throw new Error("Invalid change history. Refresh data.");
  return value.map((raw: unknown) => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("Invalid change history. Refresh data.");
    const item = raw as Record<string, unknown>;
    if (
      typeof item.id !== "string" || typeof item.recordId !== "string" ||
      (item.kind !== "grant" && item.kind !== "renew" && item.kind !== "revoke") ||
      (item.status !== "pending" && item.status !== "committed" && item.status !== "superseded") ||
      !isDemoRole(item.proposedBy) || !(item.target === null || isDemoRole(item.target)) ||
      !Array.isArray(item.approvals) || !item.approvals.every((actor: unknown) => isDemoRole(actor) && isDemoSteward(actor)) ||
      item.approvals.length > 2 || new Set(item.approvals).size !== item.approvals.length ||
      typeof item.baseVersion !== "number" || !Number.isSafeInteger(item.baseVersion) || item.baseVersion < 1 ||
      typeof item.createdAt !== "string" || !(item.committedAt === null || typeof item.committedAt === "string") ||
      (item.kind === "grant" ? item.target === null : item.target !== null) ||
      (item.status === "committed" && (item.approvals.length !== 2 || item.committedAt === null))) {
      throw new Error("Invalid change history. Refresh data.");
    }
    return { id: item.id, recordId: item.recordId, kind: item.kind, target: item.target, proposedBy: item.proposedBy,
      approvals: item.approvals.filter(isDemoRole), status: item.status, baseVersion: item.baseVersion, createdAt: item.createdAt, committedAt: item.committedAt };
  });
}
