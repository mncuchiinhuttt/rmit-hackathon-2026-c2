import type { CycleSummary } from "@/features/circle/types";

export type GrantAccess = "read" | "write";
export type GrantSubject =
  | { type: "User"; id: string }
  | { type: "Role"; id: string; clientId?: string }
  | { type: "Group"; id: string };

export interface StoredPolicy {
  recordId: string;
  access: GrantAccess;
  subject: GrantSubject;
  policyB64: string;
  expiresAt: number;
  createdAt: string;
}

export interface ReleaseArtifact {
  cycle: CycleSummary;
  ciphertext: string | null;
  readPolicy: StoredPolicy | null;
  writePolicy: StoredPolicy | null;
}

export interface SealingPayload {
  recordId: string;
  ciphertext: string;
  codeHash: string;
}

export interface OpenedRelease {
  cycle: number;
  beneficiary: string;
  amountVnd: number;
  code: string;
}
