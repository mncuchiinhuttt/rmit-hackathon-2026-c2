import type { OpenedRelease } from "@/features/releases/types";
import { DEMO_ACTORS, type DemoRole, type DemoState } from "./model";
import type { ChangeKind } from "./governance-types";

export type SimulationMutation = "seal" | "open" | "redeem";
export type SimulationCommand =
  | { type: "sign-in"; actor: DemoRole }
  | { type: "sign-out" }
  | { type: "reset" }
  | { type: "propose"; recordId: string; kind: ChangeKind; target: DemoRole | null }
  | { type: "vote"; requestId: string }
  | { type: SimulationMutation; recordId: string; code?: string };

export interface SimulationView {
  actor: DemoRole | null;
  state: DemoState | null;
  release: OpenedRelease | null;
}

export const EMPTY_SIMULATION: SimulationView = { actor: null, state: null, release: null };

export function isDemoRole(value: unknown): value is DemoRole {
  return typeof value === "string" && DEMO_ACTORS.some(actor => actor.id === value);
}
