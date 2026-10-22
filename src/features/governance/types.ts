export interface ChangeRequestView {
  id: string;
  status: string;
  actionType: string;
  authorizationCount: number;
  threshold: number;
  readyToCommit: boolean;
  authorizers: string[];
  recordIds: string[];
}

export interface GovernanceSnapshot {
  requests: ChangeRequestView[];
  verifiedAt: string;
}
