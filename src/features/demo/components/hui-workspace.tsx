"use client";

import { useRef } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SealedPackage } from "@/features/releases/components/sealed-package";
import { OpenedReleaseDialog } from "@/features/releases/components/opened-release-dialog";
import { EventHistory } from "@/features/circle/components/event-history";
import type { OpenedState } from "@/features/circle/components/circle-workspace";
import { demoArtifact } from "../fixtures";
import { demoOpenError, isDemoSteward, type DemoRole, type DemoState } from "../model";
import type { SimulationCommand } from "../simulation-contract";
import { CircleStory } from "./circle-story";
import { GroupDecisions } from "./group-decisions";
import { EvidenceDetails } from "./evidence-details";
import { SimulatedSessionHeader } from "./simulated-session-header";
import { SimulationResetDialog } from "./simulation-reset-dialog";

interface Props {
  state: DemoState; actor: DemoRole; recordId: string; busy: boolean; error: string | null; now: number;
  opened: OpenedState | null; dialogOpen: boolean;
  onCommand(command: SimulationCommand): void; onRefresh(): void; onSelect(id: string): void;
  onDialogChange(open: boolean): void; onReset(): Promise<boolean>;
}
export function HuiWorkspace(props: Props) {
  const cycle = props.state.cycles.find(item => item.recordId === props.recordId)!;
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const error = props.state.error;
  const releasePanel = <SealedPackage preview persistent cycle={cycle} artifact={demoArtifact(cycle)} openButtonRef={openButtonRef} memberCount={6} contributionVnd={1_000_000} authenticated canEncrypt={props.actor === "bao"} canDecrypt={!demoOpenError(cycle, props.actor, props.now)} loading={props.busy} pending={props.busy ? "data" : null} sealError={error?.operation === "seal" ? error.message : null} openError={error?.operation === "open" ? error.message : null} onSeal={() => props.onCommand({ type: "seal", recordId: props.recordId })} onAttemptOpen={() => props.onCommand({ type: "open", recordId: props.recordId })} />;
  const decisionsPanel = <GroupDecisions state={props.state} cycle={cycle} actor={props.actor} busy={props.busy} onCommand={props.onCommand} now={props.now} />;
  return <main className="mx-auto max-w-[1320px] space-y-7 px-4 py-5 sm:px-7 lg:px-10">
    <SimulatedSessionHeader actor={props.actor} cycle={cycle} busy={props.busy} onRefresh={props.onRefresh} onSignOut={() => props.onCommand({ type: "sign-out" })} resetControl={props.actor === "operator" ? <SimulationResetDialog disabled={props.busy} onConfirm={props.onReset} /> : null} />
    <CircleStory state={props.state} cycle={cycle} actor={props.actor} busy={props.busy} onSelect={props.onSelect} now={props.now} />
    {props.error && <Alert variant="destructive"><AlertTitle>Changes could not be confirmed</AlertTitle><AlertDescription>{props.error} Refresh data before retrying.</AlertDescription></Alert>}
    <p className="sr-only" role="status">{props.busy ? "Updating shared circle data." : ""}</p>
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(20rem,1fr)]">
      {isDemoSteward(props.actor) ? <>{decisionsPanel}{releasePanel}</> : <>{releasePanel}{decisionsPanel}</>}
    </div>
    <EvidenceDetails actor={props.actor} cycle={cycle} now={props.now} />
    <EventHistory preview events={props.state.events} recordId={props.recordId} />
    <OpenedReleaseDialog preview open={Boolean(props.dialogOpen && props.opened?.recordId === props.recordId)} release={props.opened?.release ?? null} returnFocusRef={openButtonRef} eligible={Boolean(props.opened?.eligible)} redeemed={cycle.redeemed} redeemPending={props.busy} redeemError={error?.operation === "redeem" ? error.message : null} onOpenChange={props.onDialogChange} onRedeem={() => props.onCommand({ type: "redeem", recordId: props.recordId, code: props.opened?.release.code ?? "" })} />
  </main>;
}
