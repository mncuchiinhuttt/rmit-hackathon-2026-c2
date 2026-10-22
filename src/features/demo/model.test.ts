import { expect, test } from "bun:test";
import { createDemoState, demoOpenError, reduceDemo, type DemoRole, type DemoState } from "./model";

function step(state: DemoState, type: "approve" | "open" | "seal" | "redeem", actor: DemoRole, recordId = "payout-c3") {
  return reduceDemo(state, { type, actor, recordId, at: "2026-10-22T08:00:00.000Z" });
}
function cycle(state: DemoState, recordId = "payout-c3") {
  return state.cycles.find(item => item.recordId === recordId)!;
}

test("demo needs two distinct stewards and does not reuse another cycle's approvals", () => {
  let state = createDemoState();
  expect(demoOpenError(cycle(state, "payout-c1"), "minh")).toBeNull();
  expect(demoOpenError(cycle(state), "minh")).not.toBeNull();
  state = step(state, "approve", "hanh");
  state = step(state, "approve", "hanh");
  expect(cycle(state).approvals).toEqual(["hanh"]);
  expect(state.error?.message).toContain("different steward");
  expect(demoOpenError(cycle(state), "minh")).not.toBeNull();
  state = step(state, "approve", "mai");
  expect(cycle(state).approvals).toEqual(["hanh", "mai"]);
  expect(demoOpenError(cycle(state), "minh")).toBeNull();
  expect(demoOpenError(cycle(state, "payout-c4"), "minh")).not.toBeNull();
});

test("recipient and operator cannot approve; stewards cannot read an approved package", () => {
  let state = step(createDemoState(), "approve", "minh");
  expect(cycle(state).approvals).toHaveLength(0);
  state = step(state, "approve", "operator");
  expect(cycle(state).approvals).toHaveLength(0);
  state = step(step(state, "approve", "hanh"), "approve", "tuan");
  for (const actor of ["hanh", "tuan", "mai", "bao", "operator"] as const) {
    expect(demoOpenError(cycle(state), actor)).not.toBeNull();
  }
});

test("only escrow seals; redemption is once per cycle and reset restores samples", () => {
  let state = step(createDemoState(), "seal", "minh", "payout-c4");
  expect(cycle(state, "payout-c4").sealed).toBe(false);
  state = step(state, "seal", "bao", "payout-c4");
  expect(cycle(state, "payout-c4").sealed).toBe(true);
  state = step(state, "redeem", "minh");
  expect(cycle(state).redeemed).toBe(false);
  state = step(step(state, "approve", "hanh"), "approve", "mai");
  state = step(state, "redeem", "minh");
  expect(cycle(state).redeemed).toBe(true);
  state = step(state, "redeem", "minh");
  expect(state.error?.message).toContain("already been redeemed");
  expect(state.events.filter(event => event.action === "Demo redemption recorded")).toHaveLength(1);
  expect(reduceDemo(state, { type: "reset" })).toEqual(createDemoState());
});
