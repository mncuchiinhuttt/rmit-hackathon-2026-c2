import type { Database } from "bun:sqlite";
import { randomUUID } from "node:crypto";
import { ApiError } from "@/lib/server/api-errors";
import { createDemoState, reduceDemo, type DemoRole } from "../model";
import { EMPTY_SIMULATION, type SimulationCommand, type SimulationView } from "../simulation-contract";
import { readSimulationState, writeSimulationState } from "./sqlite-state";
import { proposeChange, voteChange } from "../governance-model";

export function simulationView(database: Database, actor: DemoRole | null): SimulationView {
  if (!actor) return { ...EMPTY_SIMULATION };
  return database.transaction(() => ({ actor, state: readSimulationState(database), release: null })).deferred();
}

export function applySimulationCommand(database: Database, actor: DemoRole | null, command: Exclude<SimulationCommand, { type: "sign-in" }>, at = new Date().toISOString()): SimulationView {
  if (!actor) throw new ApiError(401, "simulation_sign_in_required", "Sign in to a sample account first.");
  if (command.type === "sign-out") throw new Error("Session commands do not mutate circle data.");
  return database.transaction((): SimulationView => {
    if (command.type === "reset") {
      if (actor !== "operator") throw new ApiError(403, "simulation_reset_forbidden", "Only the sample Operator can reset the shared demo.");
      const state = createDemoState();
      writeSimulationState(database, state);
      return { actor, state, release: null };
    }
    const current = readSimulationState(database);
    if (command.type === "propose" || command.type === "vote") {
      const state = command.type === "propose" ? proposeChange(current, actor, command.recordId, command.kind, command.target, randomUUID(), at) : voteChange(current, actor, command.requestId, at);
      writeSimulationState(database, state);
      return { actor, state, release: null };
    }
    const cycle = current.cycles.find(item => item.recordId === command.recordId);
    if (!cycle) throw new ApiError(404, "simulation_cycle_not_found", "Unknown sample cycle.");
    if (command.type === "redeem" && command.code !== `DEMO-C${cycle.number}-SAMPLE-CODE`) {
      throw new ApiError(403, "simulation_code_invalid", "The sample redemption code was not accepted.");
    }
    const state = reduceDemo(current, { type: command.type, actor, recordId: command.recordId, at });
    const event = state.events.at(-1);
    if (event) event.id = randomUUID();
    writeSimulationState(database, state);
    const release = command.type === "open" && !state.error ? {
      cycle: cycle.number, beneficiary: cycle.beneficiaryUsername, amountVnd: cycle.amountVnd,
      code: cycle.redeemed ? "" : `DEMO-C${cycle.number}-SAMPLE-CODE`,
    } : null;
    return { actor, state, release };
  }).immediate();
}
