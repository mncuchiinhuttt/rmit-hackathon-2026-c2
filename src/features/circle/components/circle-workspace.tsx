"use client";

import { useRef, type ReactNode } from "react";
import { WorkspaceSkeleton } from "@/features/circle/components/workspace-skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { SessionHeader } from "@/features/auth/components/session-header";
import { EventHistory } from "@/features/circle/components/event-history";
import { CycleSelector } from "@/features/circle/components/cycle-selector";
import type { CircleSnapshot } from "@/features/circle/types";
import { ProofPanel } from "@/features/governance/components/proof-panel";
import type { GovernanceSnapshot } from "@/features/governance/types";
import { OpenedReleaseDialog } from "@/features/releases/components/opened-release-dialog";
import { SealedPackage } from "@/features/releases/components/sealed-package";
import type { OpenedRelease, ReleaseArtifact } from "@/features/releases/types";

export type Operation = "policies" | "seal" | "open" | "redeem" | "credentials" | "data" | null;
export type PageError = { operation: Exclude<Operation, null>; message: string } | null;
export type OpenedState = { recordId: string; release: OpenedRelease; eligible: boolean };

interface CircleWorkspaceProps {
  preview?: { header: ReactNode; proofPanel: ReactNode; persistent?: boolean };
  snapshot: CircleSnapshot | null;
  artifact: ReleaseArtifact | null;
  governance: GovernanceSnapshot | null;
  loading: boolean;
  circleError: string | null;
  selectedRecordId: string;
  authenticated: boolean;
  initializing: boolean;
  username: string | null;
  isSteward: boolean;
  canEncrypt: boolean;
  canDecrypt: boolean;
  loggingOut: boolean;
  sessionError: string | null;
  pending: Operation;
  actionError: PageError;
  opened: OpenedState | null;
  dialogOpen: boolean;
  redeemedRecordId: string | null;
  onLogin(): void;
  onLogout(): void;
  onRefreshSession(): void;
  onRefreshData(): void;
  onCreatePolicies(): void;
  onSelectRecord(recordId: string): void;
  onSeal(): void;
  onAttemptOpen(): void;
  onRedeem(): void;
  onDialogChange(open: boolean): void;
}

function pendingStatus(operation: Operation) {
  switch (operation) {
    case "policies": return "Creating release policies.";
    case "seal": return "Sealing the release package.";
    case "open": return "Contacting Tide ORKs to attempt release.";
    case "redeem": return "Recording synthetic redemption.";
    case "credentials": return "Refreshing Tide session credentials.";
    case "data": return "Refreshing circle data.";
    default: return "";
  }
}
export function CircleWorkspace(props: CircleWorkspaceProps) {
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const cycle = props.snapshot?.cycles.find((entry) => entry.recordId === props.selectedRecordId) ?? null;
  const artifact = props.artifact?.cycle.recordId === props.selectedRecordId ? props.artifact : null;
  const opened = props.opened?.recordId === props.selectedRecordId ? props.opened : null;
  const dialogRelease = opened?.release ?? null;
  const redeemed = Boolean(cycle?.redeemed || props.redeemedRecordId === props.selectedRecordId);
  const dataError = props.actionError?.operation === "data" ? props.actionError.message : null;
  const openError = props.actionError?.operation === "open" ? props.actionError.message : null;
  const sealError = props.actionError?.operation === "seal" ? props.actionError.message : null;
  const policyError = props.actionError?.operation === "policies" ? props.actionError.message : null;
  const credentialError = props.actionError?.operation === "credentials" ? props.actionError.message : null;
  const redeemError = props.actionError?.operation === "redeem" ? props.actionError.message : null;
  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-[1320px] flex-col px-4 py-5 sm:px-7 sm:py-7 lg:px-10">
      {props.preview?.header ?? <SessionHeader
        authenticated={props.authenticated}
        initializing={props.initializing}
        username={props.username}
        isSteward={props.isSteward}
        canEncrypt={props.canEncrypt}
        canDecrypt={props.canDecrypt}
        refreshing={props.pending === "credentials"}
        loggingOut={props.loggingOut}
        onLogin={props.onLogin}
        onLogout={props.onLogout}
        onRefresh={props.onRefreshSession}
      />}
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{props.preview?.persistent && props.pending ? "Updating the SQLite demo." : pendingStatus(props.pending)}</p>

      <div className="flex-1 py-7 sm:py-9">
        <div className="mb-6 max-w-3xl">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-warning">Circle operations · RMIT 2026</p>
          <h1 id="circle-workspace-heading" tabIndex={-1} className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{props.snapshot?.name ?? "Circle workspace"}</h1>
          <p className="mt-2 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
            {props.preview ? "Explore the circle, switch roles and try a simulated cycle release. Everything here uses fictional data." : "Inspect each cycle, its encrypted release package and the live Tide access decisions."}
          </p>
          <p className="mt-2 text-pretty text-xs text-muted-foreground">Fictional members and VND. Funds and escrow are simulated.</p>
        </div>

        {(props.sessionError || credentialError) && (
          <Alert variant="destructive" className="mb-5">
            <AlertTitle>Tide session needs attention</AlertTitle>
            <AlertDescription>{props.sessionError ?? credentialError}</AlertDescription>
          </Alert>
        )}
        {(props.circleError || dataError) && (
          <Alert variant="destructive" className="mb-5">
            <AlertTitle>Circle data could not be refreshed</AlertTitle>
            <AlertDescription className="space-y-3">
              <p>{dataError ?? props.circleError}</p>
              <Button type="button" size="sm" variant="outline" disabled={props.pending !== null} onClick={props.onRefreshData}>Refresh circle data</Button>
            </AlertDescription>
          </Alert>
        )}

        {(props.loading || props.initializing) && !props.snapshot ? (
          <WorkspaceSkeleton />
        ) : !props.authenticated && !props.snapshot ? (
          <Alert className="border-border bg-card/80">
            <AlertTitle>Sign in with Tide to view the circle</AlertTitle>
            <AlertDescription>
              Circle data requires a verified Tide session. Use the sign-in control above; no private circle data is shown before authentication.
            </AlertDescription>
          </Alert>
        ) : !props.snapshot ? (
          <Alert variant="destructive">
            <AlertTitle>Authenticated circle data is unavailable</AlertTitle>
            <AlertDescription className="space-y-3">
              <p>{props.circleError ?? "The authenticated request has not returned a circle snapshot."}</p>
              <Button type="button" size="sm" variant="outline" disabled={props.pending !== null} onClick={props.onRefreshData}>Retry circle data</Button>
            </AlertDescription>
          </Alert>
        ) : !cycle ? (
          <Alert variant="destructive">
            <AlertTitle>Selected cycle is not present</AlertTitle>
            <AlertDescription>The current circle response has no record for {props.selectedRecordId}. Refresh the data before taking action.</AlertDescription>
          </Alert>
        ) : (
          <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(19rem,0.8fr)]">
            <div className="min-w-0 space-y-4">
              <CycleSelector cycles={props.snapshot.cycles} selectedRecordId={props.selectedRecordId} disabled={props.pending !== null} onSelect={props.onSelectRecord} />
              <SealedPackage
                persistent={props.preview?.persistent}
                preview={Boolean(props.preview)}
                cycle={cycle}
                artifact={artifact}
                openButtonRef={openButtonRef}
                memberCount={props.snapshot.memberCount}
                contributionVnd={props.snapshot.contributionVnd}
                authenticated={props.authenticated}
                canEncrypt={props.canEncrypt}
                canDecrypt={props.canDecrypt}
                loading={props.loading}
                pending={props.pending}
                sealError={sealError}
                openError={openError}
                onSeal={props.onSeal}
                onAttemptOpen={props.onAttemptOpen}
              />
              <EventHistory events={props.snapshot.events} recordId={props.selectedRecordId} preview={Boolean(props.preview)} />
            </div>
            {props.preview?.proofPanel ?? <ProofPanel
              recordId={props.selectedRecordId}
              artifact={artifact}
              governance={props.governance}
              authenticated={props.authenticated}
              isSteward={props.isSteward}
              loading={props.loading}
              policyPending={props.pending === "policies"}
              policyError={policyError}
              onCreatePolicies={props.onCreatePolicies}
            />}
          </div>
        )}
      </div>
      <OpenedReleaseDialog
        preview={Boolean(props.preview)}
        open={props.authenticated && !props.loggingOut && props.dialogOpen && dialogRelease !== null}
        release={dialogRelease}
        returnFocusRef={openButtonRef}
        eligible={Boolean(opened?.eligible)}
        redeemed={redeemed}
        redeemPending={props.pending === "redeem"}
        redeemError={redeemError}
        onOpenChange={props.onDialogChange}
        onRedeem={props.onRedeem}
      />
    </main>
  );
}
