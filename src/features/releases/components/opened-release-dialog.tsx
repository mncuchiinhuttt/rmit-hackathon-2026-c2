"use client";

import { Check, LockKeyhole } from "lucide-react";
import type { RefObject } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RedemptionAction } from "@/features/escrow/components/redemption-action";
import type { OpenedRelease } from "@/features/releases/types";

interface OpenedReleaseDialogProps {
  open: boolean;
  release: OpenedRelease | null;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
  eligible: boolean;
  redeemed: boolean;
  redeemPending: boolean;
  redeemError: string | null;
  onOpenChange(open: boolean): void;
  onRedeem(): void;
}

function formatVnd(amount: number) {
  return new Intl.NumberFormat("en", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(amount);
}

export function OpenedReleaseDialog({
  open,
  release,
  returnFocusRef,
  eligible,
  redeemed,
  redeemPending,
  redeemError,
  onOpenChange,
  onRedeem,
}: OpenedReleaseDialogProps) {
  if (!release) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onCloseAutoFocus={event => {
        event.preventDefault();
        const trigger = returnFocusRef.current;
        if (trigger?.isConnected && !trigger.disabled) trigger.focus();
        else document.getElementById("circle-workspace-heading")?.focus();
      }}>
        <DialogHeader>
          <Badge variant="outline" className="mb-2 w-fit border-positive/40 text-positive"><Check aria-hidden="true" /> Tide open succeeded</Badge>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <LockKeyhole className="size-5 text-positive" aria-hidden="true" />
            Release opened
          </DialogTitle>
          <DialogDescription>
            {eligible
              ? redeemed
                ? "The synthetic redemption was accepted. The single-use code is no longer shown."
                : "This session received the release from the live open action. Keep the redemption code private; it is not written to persistent browser storage."
              : "Tide returned release data, but this session or record does not match the expected beneficiary. The code is withheld and redemption is unavailable."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 rounded-lg border border-border bg-background/70 p-4">
          <dl className="grid grid-cols-2 gap-x-3 gap-y-4">
            <div>
              <dt className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Cycle</dt>
              <dd className="mt-1 text-base font-medium text-foreground">{release.cycle}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Beneficiary</dt>
              <dd className="mt-1 text-base font-medium text-foreground">{release.beneficiary}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{eligible ? "Synthetic release value" : "Reported package value"}</dt>
              <dd className="mt-1 text-xl font-semibold tabular-nums text-foreground">{formatVnd(release.amountVnd)}</dd>
            </div>
          </dl>
          {eligible && !redeemed ? (
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Single-use redemption code</p>
              <code className="mt-2 block max-h-28 overflow-auto break-all rounded-md border border-border bg-card px-3 py-3 font-mono text-sm text-foreground" aria-label="Redemption code">
                {release.code}
              </code>
            </div>
          ) : (
            <Alert className={eligible ? "border-positive/40 bg-positive/5" : "border-warning/40 bg-warning/5"}>
              <LockKeyhole className={eligible ? "text-positive" : "text-warning"} aria-hidden="true" />
              <AlertTitle>{eligible ? "Code no longer available" : "Code withheld"}</AlertTitle>
              <AlertDescription>
                {eligible
                  ? "The code was cleared after redemption. This result is synthetic and does not transfer funds."
                  : "The visible release did not match the authenticated beneficiary and selected cycle. No redemption code is shown."}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <Alert className="border-warning/40 bg-warning/5">
          <LockKeyhole className="text-warning" aria-hidden="true" />
          <AlertTitle>Synthetic escrow only</AlertTitle>
          <AlertDescription>This redemption records a demo outcome. It is not a bank transfer, custody service, or payment guarantee.</AlertDescription>
        </Alert>

        <RedemptionAction
          eligible={eligible}
          redeemed={redeemed}
          pending={redeemPending}
          error={redeemError}
          onRedeem={onRedeem}
        />
      </DialogContent>
    </Dialog>
  );
}
