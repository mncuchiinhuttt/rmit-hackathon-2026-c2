"use client";

import { useEffect, useRef, useState } from "react";

import { useTideSession } from "@/features/auth/client/use-tide-session";
import type { TideSessionState } from "@/features/auth/types";
import { useCircle, type CircleClientState } from "@/features/circle/client/use-circle";
import { CircleWorkspace, type OpenedState, type Operation, type PageError } from "@/features/circle/components/circle-workspace";
import { createPolicies, openRelease, redeemRelease, refreshCredentials, sealRelease } from "@/features/releases/client/release-actions";

function describeError(error: unknown) {
  if (error instanceof Error && error.message.trim()) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  return "The operation could not be completed. Check the Tide session and try again.";
}

export function CirclePage() {
  const circle = useCircle();
  const session = useTideSession();
  const key = `${session.authenticated}:${session.username}:${circle.selectedRecordId}`;
  return <CircleController key={key} circle={circle} session={session} />;
}

function CircleController({ circle, session }: {
  circle: CircleClientState;
  session: TideSessionState;
}) {
  const [pending, setPending] = useState<Operation>(null);
  const [actionError, setActionError] = useState<PageError>(null);
  const [opened, setOpened] = useState<OpenedState | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [redeemedRecordId, setRedeemedRecordId] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const cycle = circle.snapshot?.cycles.find((entry) => entry.recordId === circle.selectedRecordId) ?? null;
  const artifact = circle.artifact?.cycle.recordId === circle.selectedRecordId ? circle.artifact : null;

  const active = useRef(true);
  const operationEpoch = useRef(0);
  const signingOut = useRef(false);
  useEffect(() => {
    active.current = true;
    return () => { active.current = false; };
  }, []);

  async function refreshCircleData() {
    try {
      await circle.refresh();
    } catch (error) {
      if (active.current) setActionError({ operation: "data", message: describeError(error) });
    }
  }

  async function run(operation: Exclude<Operation, null>, action: () => Promise<void>) {
    if (signingOut.current) return;
    const epoch = operationEpoch.current;
    setPending(operation);
    setActionError(null);
    try {
      await action();
    } catch (error) {
      if (active.current && operationEpoch.current === epoch && !signingOut.current) setActionError({ operation, message: describeError(error) });
    } finally {
      if (active.current && operationEpoch.current === epoch && !signingOut.current) setPending(null);
    }
  }
  async function handleRefreshData() {
    await run("data", refreshCircleData);
  }


  async function handleCreatePolicies() {
    await run("policies", async () => {
      await createPolicies(circle.selectedRecordId);
      await refreshCircleData();
    });
  }

  async function handleSeal() {
    await run("seal", async () => {
      await sealRelease(circle.selectedRecordId);
      await refreshCircleData();
    });
  }

  async function handleAttemptOpen() {
    if (!artifact || !cycle || !session.authenticated) return;
    await run("open", async () => {
      const epoch = operationEpoch.current;
      const release = await openRelease(artifact);
      if (!active.current || signingOut.current || operationEpoch.current !== epoch) return;
      const dataMatches = release.cycle === cycle.number && release.beneficiary === cycle.beneficiaryUsername && release.amountVnd === cycle.amountVnd;
      const eligible = dataMatches && session.username === cycle.beneficiaryUsername;
      setOpened({ recordId: circle.selectedRecordId, release, eligible });
      setDialogOpen(true);
    });
  }

  async function handleRedeem() {
    if (!opened?.eligible || opened.recordId !== circle.selectedRecordId || !session.authenticated) return;
    await run("redeem", async () => {
      const epoch = operationEpoch.current;
      await redeemRelease(circle.selectedRecordId, opened.release.code);
      if (!active.current || signingOut.current || operationEpoch.current !== epoch) return;
      setRedeemedRecordId(circle.selectedRecordId);
      setOpened((current) =>
        current?.recordId === circle.selectedRecordId
          ? { ...current, release: { ...current.release, code: "" } }
          : current,
      );
      await refreshCircleData();
    });
  }

  async function handleRefreshSession() {
    await run("credentials", async () => {
      await refreshCredentials();
      await refreshCircleData();
    });
  }

  async function handleLogout() {
    signingOut.current = true;
    operationEpoch.current++;
    setOpened(null);
    setDialogOpen(false);
    setRedeemedRecordId(null);
    setActionError(null);
    setLoggingOut(true);
    try {
      await session.logout();
    } catch (error) {
      signingOut.current = false;
      if (active.current) {
        setActionError({ operation: "credentials", message: describeError(error) });
        setLoggingOut(false);
      }
    }
  }

  return (
    <CircleWorkspace
      snapshot={circle.snapshot}
      artifact={circle.artifact}
      governance={circle.governance}
      loading={circle.loading}
      circleError={circle.error}
      selectedRecordId={circle.selectedRecordId}
      authenticated={session.authenticated}
      initializing={session.initializing}
      username={session.username}
      isSteward={session.isSteward}
      canEncrypt={session.canEncrypt}
      canDecrypt={session.canDecrypt}
      sessionError={session.error}
      pending={loggingOut ? "credentials" : pending}
      loggingOut={loggingOut}
      actionError={actionError}
      opened={opened}
      dialogOpen={dialogOpen}
      redeemedRecordId={redeemedRecordId}
      onLogin={session.login}
      onLogout={handleLogout}
      onRefreshData={handleRefreshData}
      onRefreshSession={handleRefreshSession}
      onCreatePolicies={handleCreatePolicies}
      onSelectRecord={circle.selectRecord}
      onSeal={handleSeal}
      onAttemptOpen={handleAttemptOpen}
      onRedeem={handleRedeem}
      onDialogChange={(open) => {
        setDialogOpen(open);
        if (!open) setOpened(null);
      }}
    />
  );
}
