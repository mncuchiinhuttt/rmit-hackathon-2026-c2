import { CYCLE_NUMBERS, cycleMetadata } from "@/features/circle/model";
import type { AuditEvent, CycleSummary } from "@/features/circle/types";

export type DemoRole = "minh" | "hanh" | "tuan" | "mai" | "bao" | "operator";
export const DEMO_ACTORS: { id: DemoRole; name: string; role: string }[] = [
  { id: "minh", name: "Minh", role: "Recipient" },
  { id: "hanh", name: "Hanh", role: "Steward" },
  { id: "tuan", name: "Tuan", role: "Steward" },
  { id: "mai", name: "Mai", role: "Steward" },
  { id: "bao", name: "Bao", role: "Escrow" },
  { id: "operator", name: "Operator", role: "Host" },
];
export const DEMO_TIME = "2026-10-22T07:00:00.000Z";
export interface DemoCycle extends CycleSummary { approvals: DemoRole[] }
export interface DemoState {
  cycles: DemoCycle[];
  events: AuditEvent[];
  error: { operation: "seal" | "policies" | "open" | "redeem"; message: string } | null;
}
export type DemoAction = { type: "reset" } | { type: "clear" } | {
  type: "seal" | "approve" | "open" | "redeem";
  actor: DemoRole;
  recordId: string;
  at: string;
};

export function isDemoSteward(actor: DemoRole) {
  return actor === "hanh" || actor === "tuan" || actor === "mai";
}

export function createDemoState(): DemoState {
  return {
    cycles: CYCLE_NUMBERS.map(number => {
      const sealed = number !== 4;
      return {
        ...cycleMetadata(number), sealed, redeemed: false,
        ciphertextBytes: sealed ? ("DEMO_ONLY: payout-c" + number).length : 0,
        sealedAt: sealed ? DEMO_TIME : null,
        approvals: number === 1 ? ["hanh", "tuan"] : [],
      };
    }),
    events: [
      { id: "demo-seal-c3", at: DEMO_TIME, actor: "Bao", action: "Demo package sealed", recordId: "payout-c3" },
      { id: "demo-c1", at: DEMO_TIME, actor: "Hanh + Tuan", action: "Demo access approved for cycle 1", recordId: "payout-c1" },
    ],
    error: null,
  };
}

export function demoOpenError(cycle: DemoCycle, actor: DemoRole): string | null {
  if (!cycle.sealed) return "No sample package is sealed. Switch to Bao to seal it first.";
  if (actor !== "minh") return "Only Minh, the demo recipient, can open this package. Stewards approve access but cannot read.";
  if (cycle.approvals.length < 2) return "Minh needs two different steward approvals for this cycle. Approvals for another cycle do not count.";
  return null;
}

export function reduceDemo(state: DemoState, action: DemoAction): DemoState {
  if (action.type === "reset") return createDemoState();
  if (action.type === "clear") return { ...state, error: null };
  const cycle = state.cycles.find(item => item.recordId === action.recordId);
  const operation = action.type === "approve" ? "policies" : action.type;
  if (!cycle) return { ...state, error: { operation, message: "Unknown demo cycle." } };
  let message: string | null = null;
  if (action.type === "seal") {
    if (action.actor !== "bao") message = "Only Bao, the demo escrow, can seal a sample package.";
    else if (cycle.sealed) message = "This sample package is already sealed.";
  } else if (action.type === "approve") {
    if (!isDemoSteward(action.actor)) message = "Switch to Hanh, Tuan or Mai to add a demo approval.";
    else if (!cycle.sealed) message = "Seal this sample package before approving.";
    else if (cycle.approvals.includes(action.actor)) message = "This steward has already approved. Choose a different steward.";
    else if (cycle.approvals.length >= 2) message = "Two demo approvals are already recorded.";
  } else {
    message = demoOpenError(cycle, action.actor);
    if (!message && action.type === "redeem" && cycle.redeemed) message = "This demo code has already been redeemed.";
  }
  const name = DEMO_ACTORS.find(actor => actor.id === action.actor)?.name ?? action.actor;
  const nextCycle = { ...cycle, approvals: [...cycle.approvals] };
  let label = "Demo access denied";
  if (!message) {
    if (action.type === "seal") {
      nextCycle.sealed = true;
      nextCycle.sealedAt = action.at;
      nextCycle.ciphertextBytes = ("DEMO_ONLY: " + cycle.recordId).length;
      label = "Demo package sealed";
    } else if (action.type === "approve") {
      nextCycle.approvals.push(action.actor);
      label = "Demo approval " + nextCycle.approvals.length + "/2 recorded";
    } else if (action.type === "redeem") {
      nextCycle.redeemed = true;
      label = "Demo redemption recorded";
    } else label = "Demo package opened";
  }
  return {
    cycles: state.cycles.map(item => item.recordId === cycle.recordId ? nextCycle : item),
    error: message ? { operation, message } : null,
    events: [...state.events, {
      id: action.at + "-" + state.events.length, at: action.at,
      actor: name, action: label, recordId: cycle.recordId,
    }].slice(-50),
  };
}
