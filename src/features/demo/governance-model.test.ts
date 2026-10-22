import { expect, test } from "bun:test";
import { proposeChange, voteChange } from "./governance-model";
import { createDemoState, demoOpenError, reduceDemo, type DemoRole, type DemoState } from "./model";
import type { ChangeKind } from "./governance-types";

const at = "2026-10-22T08:00:00.000Z";
const cycle = (state: DemoState, id = "payout-c3") => state.cycles.find(item => item.recordId === id)!;
function propose(state: DemoState, actor: DemoRole, kind: ChangeKind, recordId = "payout-c3", time = at) {
  return proposeChange(state, actor, recordId, kind, kind === "grant" ? actor : null, `change-${state.changes.length}`, time);
}
function approve(state: DemoState, actor: DemoRole, time = at) { return voteChange(state, actor, state.changes.at(-1)!.id, time); }

test("Operator cannot self-grant: pending and one vote confer no access; only committed grant works", () => {
  let state = createDemoState(at);
  expect(demoOpenError(cycle(state), "operator")).not.toBeNull();
  state = propose(state, "operator", "grant");
  expect(state.changes[0].status).toBe("pending");
  expect(cycle(state).readers).not.toContain("operator");
  expect(approve(state, "operator").error).not.toBeNull();
  state = approve(state, "hanh");
  expect(demoOpenError(cycle(state), "operator")).not.toBeNull();
  expect(approve(state, "hanh").error?.message).toContain("different steward");
  state = approve(state, "mai");
  expect(state.changes[0].status).toBe("committed");
  expect(state.changes[0].approvals).toEqual(["hanh", "mai"]);
  expect(demoOpenError(cycle(state), "operator")).toBeNull();
  expect(reduceDemo(state, { type: "redeem", actor: "operator", recordId: "payout-c3", at }).error?.message).toContain("scheduled beneficiary");
});

test("a proposing steward cannot supply any of their own two approval votes", () => {
  let state = propose(createDemoState(at), "hanh", "grant");
  expect(approve(state, "hanh").error?.message).toContain("own proposal");
  state = approve(approve(state, "tuan"), "mai");
  expect(cycle(state).readers).toContain("hanh");
});

test("turns rotate to Bao; Minh's earlier reader grant never opens Bao's turn", () => {
  let state = createDemoState(at);
  expect(cycle(state, "payout-c1").beneficiaryUsername).toBe("minh");
  expect(cycle(state, "payout-c4").beneficiaryUsername).toBe("bao");
  state = reduceDemo(state, { type: "seal", actor: "bao", recordId: "payout-c4", at });
  state = propose(state, "bao", "grant", "payout-c4");
  state = approve(approve(state, "hanh"), "tuan");
  expect(demoOpenError(cycle(state, "payout-c4"), "bao")).toBeNull();
  expect(demoOpenError(cycle(state, "payout-c4"), "minh")).not.toBeNull();
  expect(demoOpenError(cycle(state, "payout-c1"), "bao")).not.toBeNull();
});

test("expiry denies at the exact boundary; renewal needs two votes and preserves record scope", () => {
  let state = createDemoState(at);
  const initial = cycle(state, "payout-c1");
  const expired = new Date(initial.policyExpiresAt * 1000).toISOString();
  expect(demoOpenError(initial, "minh", initial.policyExpiresAt - 1)).toBeNull();
  expect(demoOpenError(initial, "minh", initial.policyExpiresAt)).toContain("expired");
  state = propose(state, "minh", "renew", "payout-c1", expired);
  state = approve(state, "hanh", expired);
  expect(cycle(state, "payout-c1").policyExpiresAt).toBe(initial.policyExpiresAt);
  state = approve(state, "tuan", expired);
  expect(cycle(state, "payout-c1").policyExpiresAt).toBe(initial.policyExpiresAt + 48 * 3600);
  expect(cycle(state, "payout-c1").readers).toEqual(["minh"]);
  expect(cycle(state).readers).toEqual([]);
});

test("committed revocation blocks future opens and renewal does not restore revoked readers", () => {
  let state = createDemoState(at);
  state = propose(state, "operator", "revoke", "payout-c1");
  state = approve(state, "hanh");
  expect(demoOpenError(cycle(state, "payout-c1"), "minh")).toBeNull();
  state = approve(state, "tuan");
  expect(demoOpenError(cycle(state, "payout-c1"), "minh")).toContain("revoked");
  state = propose(state, "minh", "renew", "payout-c1");
  state = approve(approve(state, "hanh"), "mai");
  expect(cycle(state, "payout-c1").policyRevoked).toBe(false);
  expect(demoOpenError(cycle(state, "payout-c1"), "minh")).not.toBeNull();
});

test("changed policy versions supersede pending proposals instead of silently rebasing grants", () => {
  let state = propose(createDemoState(at), "operator", "grant");
  const grantId = state.changes[0].id;
  state = propose(state, "minh", "renew");
  state = approve(approve(state, "hanh"), "tuan");
  expect(state.changes.find(change => change.id === grantId)?.status).toBe("superseded");
  expect(voteChange(state, "mai", grantId, at).error).not.toBeNull();
  expect(cycle(state).readers).not.toContain("operator");
});

test("a grant cannot commit if its policy expires between the first and second votes", () => {
  let state = propose(createDemoState(at), "operator", "grant");
  state = approve(state, "hanh");
  const expiry = new Date(cycle(state).policyExpiresAt * 1000).toISOString();
  const result = approve(state, "tuan", expiry);
  expect(result.error?.message).toContain("expired");
  expect(result.changes[0].status).toBe("pending");
  expect(result.changes[0].approvals).toEqual(["hanh"]);
  expect(cycle(result).readers).not.toContain("operator");
});
