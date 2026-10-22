"use client";

import { useEffect, useState } from "react";
import { CircleWorkspace, type OpenedState } from "@/features/circle/components/circle-workspace";
import { useSqliteSimulation } from "../client/use-sqlite-simulation";
import { demoArtifact, demoSession, demoSnapshot } from "../fixtures";
import type { SimulationMutation } from "../simulation-contract";
import { DemoProofPanel } from "./demo-proof-panel";
import { SimulatedSignIn } from "./simulated-sign-in";
import { SimulatedSessionHeader } from "./simulated-session-header";
import { SimulationResetDialog } from "./simulation-reset-dialog";

export function SqliteDemoPage() {
  const { view, busy, initializing, error, request } = useSqliteSimulation();
  const [recordId, setRecordId] = useState("payout-c3");
  const [opened, setOpened] = useState<(OpenedState & { actor: string }) | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [operation, setOperation] = useState<SimulationMutation | null>(null);
  useEffect(() => { if (view.actor) document.getElementById("circle-workspace-heading")?.focus(); }, [view.actor]);

  function clearOpened() { setOpened(null); setDialogOpen(false); }
  async function refresh() { clearOpened(); await request(); }
  async function act(type: SimulationMutation) {
    setOperation(type);
    const result = await request({ type, recordId, ...(type === "redeem" ? { code: opened?.release.code ?? "" } : {}) });
    setOperation(null);
    if (result?.release && result.actor) {
      setOpened({ recordId, actor: result.actor, eligible: true, release: result.release });
      setDialogOpen(true);
    } else if (type === "redeem" && result?.state && !result.state.error) {
      setOpened(current => current ? { ...current, release: { ...current.release, code: "" } } : null);
    }
  }
  if (initializing) return <main className="mx-auto max-w-3xl px-6 py-12"><h1 className="text-2xl font-semibold">Hostless Hui</h1><p role="status" className="mt-3 text-muted-foreground">Loading the SQLite demo and sample session...</p></main>;
  if (!view.actor || !view.state) return <SimulatedSignIn busy={busy} error={error} onRetry={() => void refresh()} onSignIn={actor => { clearOpened(); void request({ type: "sign-in", actor }); }} />;
  const actor = view.actor;
  const state = view.state;
  const cycle = state.cycles.find(item => item.recordId === recordId) ?? state.cycles[0];
  const session = demoSession(actor, cycle);
  const visibleOpened = opened?.actor === actor ? opened : null;
  return (
    <CircleWorkspace
      preview={{ persistent: true,
        header: <SimulatedSessionHeader actor={actor} cycle={cycle} busy={busy} onRefresh={() => void refresh()} onSignOut={() => { clearOpened(); void request({ type: "sign-out" }); }}
          resetControl={actor === "operator" ? <SimulationResetDialog disabled={busy} onConfirm={async () => { clearOpened(); const result = await request({ type: "reset" }); return Boolean(result?.state && !result.state.error); }} /> : null} />,
        proofPanel: <DemoProofPanel requireSignIn disabled={busy} cycle={cycle} actor={actor} error={state.error?.operation === "policies" ? state.error.message : null} onApprove={() => void act("approve")} />,
      }}
      snapshot={demoSnapshot(state, session)} artifact={demoArtifact(cycle)} governance={null}
      loading={busy} circleError={error} selectedRecordId={recordId}
      authenticated initializing={false} username={actor} isSteward={session.isSteward}
      canEncrypt={session.canEncrypt} canDecrypt={session.canDecrypt}
      sessionError={null} pending={busy ? operation === "approve" ? "policies" : operation ?? "data" : null} loggingOut={false} actionError={state.error}
      opened={visibleOpened} dialogOpen={dialogOpen} redeemedRecordId={cycle.redeemed ? recordId : null}
      onLogin={() => void refresh()} onLogout={() => { clearOpened(); void request({ type: "sign-out" }); }} onRefreshSession={() => void refresh()} onRefreshData={() => void refresh()}
      onCreatePolicies={() => void act("approve")} onSelectRecord={value => { clearOpened(); setRecordId(value); }}
      onSeal={() => void act("seal")} onAttemptOpen={() => void act("open")} onRedeem={() => void act("redeem")}
      onDialogChange={value => { setDialogOpen(value); if (!value) setOpened(null); }}
    />
  );
}
