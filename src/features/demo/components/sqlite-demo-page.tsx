"use client";

import { useEffect, useState } from "react";
import type { OpenedState } from "@/features/circle/components/circle-workspace";
import { useSqliteSimulation } from "../client/use-sqlite-simulation";
import type { SimulationCommand } from "../simulation-contract";
import { SimulatedSignIn } from "./simulated-sign-in";
import { HuiWorkspace } from "./hui-workspace";

export function SqliteDemoPage() {
  const { view, busy, initializing, error, request } = useSqliteSimulation();
  const [recordId, setRecordId] = useState("payout-c3");
  const [opened, setOpened] = useState<(OpenedState & { actor: string }) | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now() / 1000);
  useEffect(() => { if (view.actor) document.getElementById("circle-workspace-heading")?.focus(); }, [view.actor]);
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now() / 1000), 15_000); return () => window.clearInterval(timer); }, []);

  function clearOpened() { setOpened(null); setDialogOpen(false); }
  async function refresh() { clearOpened(); await request(); }
  async function act(command: SimulationCommand) {
    if (busy) return;
    if (command.type !== "redeem") clearOpened();
    const result = await request(command);
    if (result?.release && result.actor) {
      const releasedCycle = result.state?.cycles.find(cycle => cycle.number === result.release?.cycle);
      setOpened({ recordId: releasedCycle!.recordId, actor: result.actor, eligible: result.actor === result.release.beneficiary, release: result.release });
      setDialogOpen(true);
    } else if (command.type === "redeem" && result?.state && !result.state.error) {
      setOpened(current => current ? { ...current, release: { ...current.release, code: "" } } : null);
    }
  }
  if (initializing) return <main className="mx-auto max-w-3xl px-6 py-12"><h1 className="text-2xl font-semibold">Hostless Hui</h1><p role="status" className="mt-3 text-muted-foreground">Loading the SQLite demo and sample session...</p></main>;
  if (!view.actor || !view.state) return <SimulatedSignIn busy={busy} error={error} onRetry={() => void refresh()} onSignIn={actor => { clearOpened(); void request({ type: "sign-in", actor }); }} />;
  return <HuiWorkspace state={view.state} actor={view.actor} recordId={recordId} busy={busy} error={error} now={now}
    opened={opened?.actor === view.actor ? opened : null} dialogOpen={dialogOpen}
    onCommand={command => void act(command)} onRefresh={() => void refresh()}
    onSelect={value => { if (view.state?.cycles.some(cycle => cycle.recordId === value)) { clearOpened(); setRecordId(value); } }}
    onDialogChange={value => { setDialogOpen(value); if (!value) setOpened(null); }}
    onReset={async () => { clearOpened(); const result = await request({ type: "reset" }); return Boolean(result?.state && !result.state.error); }}
  />;
}
