import type { DemoRole } from "./model";

export const POLICY_LIFETIME_SECONDS = 48 * 60 * 60;
export type ChangeKind = "grant" | "renew" | "revoke";
export interface DemoChange {
  id: string;
  recordId: string;
  kind: ChangeKind;
  target: DemoRole | null;
  proposedBy: DemoRole;
  approvals: DemoRole[];
  status: "pending" | "committed" | "superseded";
  baseVersion: number;
  createdAt: string;
  committedAt: string | null;
}
