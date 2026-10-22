import { ApiError } from "@/lib/server/api-errors";
import { isRecord } from "@/lib/server/guards";
import { CYCLE_NUMBERS, cycleMetadata } from "@/features/circle/model";
import type { ChangeRequestView } from "@/features/governance/types";

function invalidResponse(): never {
  throw new ApiError(502, "tide_read_failed", "Tide governance data could not be read.");
}

function releaseRoleRecords(value: unknown): Map<string, string> {
  if (!Array.isArray(value)) return invalidResponse();
  const metadata = CYCLE_NUMBERS.map(cycleMetadata);
  const records = new Map<string, string>();
  for (const role of value) {
    if (!isRecord(role) || typeof role.id !== "string" || typeof role.name !== "string") return invalidResponse();
    const cycle = metadata.find((entry) => entry.releaseRole === role.name);
    if (cycle) records.set(role.id, cycle.recordId);
  }
  if (records.size !== metadata.length) return invalidResponse();
  return records;
}

function recordIds(value: unknown, records: Map<string, string>): string[] {
  if (!Array.isArray(value)) return [];
  const matches = new Set<string>();
  for (const row of value) {
    if (!isRecord(row) || typeof row.ROLE_ID !== "string") continue;
    const recordId = records.get(row.ROLE_ID);
    if (recordId) matches.add(recordId);
  }
  return [...matches];
}

export function parseChangeRequests(requests: unknown, roles: unknown): ChangeRequestView[] {
  if (!Array.isArray(requests)) return invalidResponse();
  const records = releaseRoleRecords(roles);
  const result = new Map<string, ChangeRequestView>();
  for (const value of requests) {
    if (!isRecord(value)) return invalidResponse();
    const affectedRecords = recordIds(value.rows, records);
    if (affectedRecords.length === 0) continue;
    if (typeof value.id !== "string" || typeof value.status !== "string" || typeof value.actionType !== "string") return invalidResponse();
    if (typeof value.authorizationCount !== "number" || !Number.isSafeInteger(value.authorizationCount) || value.authorizationCount < 0) return invalidResponse();
    if (typeof value.threshold !== "number" || !Number.isSafeInteger(value.threshold) || value.threshold < 1 || typeof value.readyToCommit !== "boolean") return invalidResponse();
    if (!Array.isArray(value.authorizers)) return invalidResponse();
    const authorizers = value.authorizers.map((item: unknown) => {
      if (!isRecord(item) || typeof item.username !== "string" || item.username.length === 0) return invalidResponse();
      return item.username;
    });
    result.set(value.id, {
      id: value.id,
      status: value.status,
      actionType: value.actionType,
      authorizationCount: value.authorizationCount,
      threshold: value.threshold,
      readyToCommit: value.readyToCommit,
      authorizers,
      recordIds: affectedRecords,
    });
  }
  return [...result.values()];
}
