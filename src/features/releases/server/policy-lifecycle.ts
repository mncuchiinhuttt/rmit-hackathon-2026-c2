import { ApiError } from "@/lib/server/api-errors";
import type { StoredPolicy } from "../types";

export function assertPolicyReplacement(existing: StoredPolicy | undefined, incoming: StoredPolicy, sealed: boolean, now: number): void {
  if (existing && existing.expiresAt > now) throw new ApiError(409, "policy_exists", "A current policy cannot be silently replaced.");
  if (!sealed) return;
  if (!existing || incoming.access !== "read" || existing.access !== "read") {
    throw new ApiError(409, "release_already_sealed", "After sealing, only an expired read policy may be renewed through Tide. The write policy and ciphertext remain unchanged.");
  }
  if (incoming.recordId !== existing.recordId || incoming.subject.type !== existing.subject.type || incoming.subject.id !== existing.subject.id ||
      (incoming.subject.type === "Role" && existing.subject.type === "Role" && incoming.subject.clientId !== existing.subject.clientId)) {
    throw new ApiError(409, "renewal_scope_changed", "A renewal must preserve the existing record, subject and read-only access.");
  }
}
