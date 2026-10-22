import { POLICY_LIFETIME_SECONDS, type ChangeKind, type DemoChange } from "./governance-types";
import { isDemoSteward, type DemoRole, type DemoState } from "./model";

const denied = (state: DemoState, message: string): DemoState => ({ ...state, error: { operation: "policies", message } });

export function proposeChange(state: DemoState, actor: DemoRole, recordId: string, kind: ChangeKind, target: DemoRole | null, id: string, at: string): DemoState {
  const cycle = state.cycles.find(item => item.recordId === recordId);
  if (!cycle?.sealed) return denied(state, "Bao must seal this cycle before a change can be proposed.");
  if (kind === "grant" && !target) return denied(state, "Choose a reader for this cycle.");
  if (kind === "grant" && (cycle.policyRevoked || cycle.policyExpiresAt <= Date.parse(at) / 1000)) return denied(state, "Renew the expired or revoked policy before requesting reader access.");
  if (kind === "grant" && cycle.readers.includes(target!)) return denied(state, "This reader already has committed access. No new grant was created.");
  if (state.changes.some(item => item.recordId === recordId && item.status === "pending" && item.kind === kind && item.target === target)) return denied(state, "An equivalent change is already pending. Review that request instead.");
  const changes = state.changes.length < 50 ? state.changes : state.changes.filter(item => item.status === "pending");
  if (changes.length >= 50) return denied(state, "Too many pending changes. Finish existing requests before proposing more.");
  const change: DemoChange = { id, recordId, kind, target: kind === "grant" ? target : null, proposedBy: actor, approvals: [], status: "pending", baseVersion: cycle.policyVersion, createdAt: at, committedAt: null };
  return { ...state, error: null, changes: [...changes, change], events: [...state.events, { id, at, actor, recordId, action: `Proposed ${kind}; not applied` }].slice(-50) };
}

export function voteChange(state: DemoState, actor: DemoRole, requestId: string, at: string): DemoState {
  const change = state.changes.find(item => item.id === requestId);
  if (!change || change.status !== "pending") return denied(state, "This change is not pending. Refresh before voting.");
  if (!isDemoSteward(actor)) return denied(state, "Only Hanh, Tuan or Mai can approve a change. Running the app confers no approval rights.");
  if (change.proposedBy === actor) return denied(state, "You cannot approve your own proposal. Two other stewards must review it.");
  if (change.approvals.includes(actor)) return denied(state, "This steward has already approved. A different steward is required.");
  const cycle = state.cycles.find(item => item.recordId === change.recordId)!;
  if (cycle.policyVersion !== change.baseVersion) return denied(state, "The policy version changed. Submit a new proposal for the current scope.");
  const approvals = [...change.approvals, actor];
  const commit = approvals.length >= 2;
  if (commit && change.kind === "grant" && (cycle.policyRevoked || cycle.policyExpiresAt <= Date.parse(at) / 1000)) return denied(state, "The policy expired or was revoked while approvals were pending. Renew it and propose again.");
  const updated = { ...cycle, readers: [...cycle.readers], approvals: [...cycle.approvals] };
  if (commit) {
    updated.policyVersion += 1;
    if (change.kind === "grant" && change.target) {
      updated.readers.push(change.target);
      if (change.target === cycle.beneficiaryUsername) updated.approvals = approvals;
    } else if (change.kind === "renew") {
      updated.policyExpiresAt = Math.floor(Date.parse(at) / 1000) + POLICY_LIFETIME_SECONDS;
      updated.policyRevoked = false;
    } else if (change.kind === "revoke") {
      updated.policyRevoked = true; updated.readers = []; updated.approvals = [];
    }
  }
  return { ...state, error: null,
    cycles: state.cycles.map(item => item.recordId === cycle.recordId ? updated : item),
    changes: state.changes.map(item => item.id === requestId ? { ...item, approvals, status: commit ? "committed" : "pending", committedAt: commit ? at : null } : commit && item.recordId === cycle.recordId && item.status === "pending" ? { ...item, status: "superseded" } : item),
    events: [...state.events, { id: `${requestId}-${approvals.length}`, at, actor, recordId: cycle.recordId, action: commit ? `Committed ${change.kind} after 2 independent approvals` : `Approved ${change.kind} 1/2; not applied` }].slice(-50),
  };
}
