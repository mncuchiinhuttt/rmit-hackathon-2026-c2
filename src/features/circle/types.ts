import type { SessionView } from "@/features/auth/types";

export interface CycleSummary {
  id: string;
  number: number;
  recordId: string;
  amountVnd: number;
  beneficiary: string;
  beneficiaryUsername: string;
  releaseRole: string;
  sealed: boolean;
  redeemed: boolean;
  ciphertextBytes: number;
  sealedAt: string | null;
}

export interface AuditEvent {
  id: string;
  at: string;
  actor: string;
  action: string;
  recordId: string;
}

export interface CircleSnapshot {
  name: string;
  memberCount: number;
  contributionVnd: number;
  synthetic: true;
  cycles: CycleSummary[];
  session: SessionView;
  events: AuditEvent[];
}
