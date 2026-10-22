"use client";

import { useReducer, useState } from "react";
import { CircleWorkspace, type OpenedState } from "@/features/circle/components/circle-workspace";
import { demoArtifact, demoSession, demoSnapshot } from "../fixtures";
import { createDemoState, demoOpenError, reduceDemo, type DemoAction, type DemoRole } from "../model";
import { DemoHeader } from "./demo-header";
import { DemoProofPanel } from "./demo-proof-panel";

export function DemoPage() {
  const [state, dispatch] = useReducer(reduceDemo, undefined, createDemoState);
  const [actor, setActor] = useState<DemoRole>("minh");
  const [recordId, setRecordId] = useState("payout-c3");
  const [opened, setOpened] = useState<OpenedState | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const cycle = state.cycles.find(item => item.recordId === recordId) ?? state.cycles[0];
  const session = demoSession(actor, cycle);

  function act(type: Exclude<DemoAction["type"], "reset" | "clear">) {
    dispatch({ type, actor, recordId, at: new Date().toISOString() });
  }
  function clearOpened() {
    setOpened(null);
    setDialogOpen(false);
    dispatch({ type: "clear" });
  }
  function changeActor(value: DemoRole) { clearOpened(); setActor(value); }
  function selectRecord(value: string) {
    if (!state.cycles.some(item => item.recordId === value)) return;
    clearOpened();
    setRecordId(value);
  }
  function reset() {
    clearOpened();
    dispatch({ type: "reset" });
    setActor("minh");
    setRecordId("payout-c3");
  }
  function openPackage() {
    act("open");
    if (demoOpenError(cycle, actor)) return;
    setOpened({
      recordId, eligible: true,
      release: { cycle: cycle.number, beneficiary: "minh", amountVnd: cycle.amountVnd, code: cycle.redeemed ? "" : "DEMO-C" + cycle.number + "-SAMPLE-CODE" },
    });
    setDialogOpen(true);
  }
  function redeem() {
    act("redeem");
    if (demoOpenError(cycle, actor) || cycle.redeemed) return;
    setOpened(current => current ? { ...current, release: { ...current.release, code: "" } } : null);
  }
  return (
    <CircleWorkspace
      preview={{
        header: <DemoHeader actor={actor} onActorChange={changeActor} onReset={reset} />,
        proofPanel: <DemoProofPanel cycle={cycle} actor={actor} error={state.error?.operation === "policies" ? state.error.message : null} onApprove={() => act("approve")} />,
      }}
      snapshot={demoSnapshot(state, session)} artifact={demoArtifact(cycle)} governance={null}
      loading={false} circleError={null} selectedRecordId={recordId}
      authenticated initializing={false} username={actor} isSteward={session.isSteward}
      canEncrypt={session.canEncrypt} canDecrypt={session.canDecrypt}
      sessionError={null} pending={null} loggingOut={false} actionError={state.error}
      opened={opened} dialogOpen={dialogOpen} redeemedRecordId={cycle.redeemed ? recordId : null}
      onLogin={clearOpened} onLogout={clearOpened} onRefreshSession={clearOpened} onRefreshData={clearOpened}
      onCreatePolicies={() => act("approve")} onSelectRecord={selectRecord}
      onSeal={() => act("seal")} onAttemptOpen={openPackage} onRedeem={redeem}
      onDialogChange={value => { setDialogOpen(value); if (!value) setOpened(null); }}
    />
  );
}
