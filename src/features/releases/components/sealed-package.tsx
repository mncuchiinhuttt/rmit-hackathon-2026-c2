import type { RefObject } from "react";
import { Check, LockKeyhole, PackageOpen, ShieldAlert, WalletCards } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { CycleSummary } from "@/features/circle/types";
import type { ReleaseArtifact } from "@/features/releases/types";

type PendingOperation = "policies" | "seal" | "open" | "redeem" | "credentials" | "data" | null;

interface SealedPackageProps {
  cycle: CycleSummary;
  memberCount: number;
  contributionVnd: number;
  artifact: ReleaseArtifact | null;
  openButtonRef: RefObject<HTMLButtonElement | null>;
  authenticated: boolean;
  canEncrypt: boolean;
  canDecrypt: boolean;
  loading: boolean;
  pending: PendingOperation;
  sealError: string | null;
  openError: string | null;
  onSeal(): void;
  onAttemptOpen(): void;
}

function formatVnd(amount: number) {
  return new Intl.NumberFormat("en", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(amount);
}

export function SealedPackage({
  cycle,
  memberCount,
  contributionVnd,
  artifact,
  openButtonRef,
  authenticated,
  canEncrypt,
  canDecrypt,
  loading,
  pending,
  sealError,
  openError,
  onSeal,
  onAttemptOpen,
}: SealedPackageProps) {
  const hasCiphertext = Boolean(artifact?.ciphertext);
  const hasReadPolicy = artifact?.readPolicy !== null && artifact?.readPolicy !== undefined;
  const hasWritePolicy = artifact?.writePolicy !== null && artifact?.writePolicy !== undefined;
  const statesAgree = artifact !== null && artifact.cycle.sealed === cycle.sealed;
  const canAttempt = authenticated && cycle.sealed && statesAgree && hasCiphertext && hasReadPolicy;
  const canSeal = authenticated && canEncrypt && !cycle.sealed && statesAgree && hasWritePolicy;

  return (
    <Card className="relative overflow-hidden border-white/10 bg-card/90 shadow-xl shadow-black/20">
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Cycle {cycle.number} of {memberCount}
            </p>
            <CardTitle role="heading" aria-level={2} className="mt-1 flex items-center gap-2 text-xl sm:text-2xl">
              <LockKeyhole className="size-5 text-warning" aria-hidden="true" />
              Release package
            </CardTitle>
            <CardDescription className="mt-2 max-w-xl">
              The payout is sealed under Tide policy. Any authenticated circle member may attempt disclosure; the ORKs decide whether this session can open it.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {cycle.redeemed ? (
              <Badge variant="outline" className="border-positive/40 text-positive"><Check aria-hidden="true" /> Redeemed</Badge>
            ) : cycle.sealed ? (
              <Badge variant="outline" className="border-warning/40 text-warning"><LockKeyhole aria-hidden="true" /> Sealed</Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">Unsealed</Badge>
            )}
            <Badge variant="secondary"><WalletCards aria-hidden="true" /> Synthetic VND</Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid gap-3 rounded-lg border border-border bg-background/55 p-4 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Release amount</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-foreground sm:text-3xl">{formatVnd(cycle.amountVnd)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Contribution {formatVnd(contributionVnd)} per member · {memberCount} fictional members · no funds move</p>
          </div>
          <div className="sm:border-l sm:border-border sm:pl-4">
            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Scheduled beneficiary</p>
            <p className="mt-1 text-lg font-medium text-foreground">{cycle.beneficiary}</p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">payout-c{cycle.number}</p>
          </div>
        </div>

        {loading && !artifact ? (
          <div className="space-y-2" role="status" aria-label="Loading release artifact">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : artifact && !statesAgree ? (
          <Alert className="border-warning/40 bg-warning/5">
            <ShieldAlert className="text-warning" aria-hidden="true" />
            <AlertTitle>Cycle data is still synchronizing</AlertTitle>
            <AlertDescription>The circle record and release artifact report different seal states. Refresh before taking action.</AlertDescription>
          </Alert>
        ) : !cycle.sealed ? (
          <Alert className="border-border bg-background/55">
            <PackageOpen aria-hidden="true" />
            <AlertTitle>No package sealed</AlertTitle>
            <AlertDescription>
              This cycle has no stored ciphertext. An authenticated escrow session can seal the release after the write policy is available.
            </AlertDescription>
          </Alert>
        ) : !artifact || !hasCiphertext ? (
          <Alert className="border-warning/40 bg-warning/5">
            <ShieldAlert className="text-warning" aria-hidden="true" />
            <AlertTitle>Sealed state is still propagating</AlertTitle>
            <AlertDescription>
              The circle record reports a sealed release, but matching ciphertext is not available in the current response. Refresh the circle data before attempting disclosure.
            </AlertDescription>
          </Alert>
        ) : null}

        {sealError && (
          <Alert variant="destructive">
            <AlertTitle>Release sealing failed</AlertTitle>
            <AlertDescription>{sealError}</AlertDescription>
          </Alert>
        )}
        {openError && (
          <Alert variant="destructive">
            <ShieldAlert aria-hidden="true" />
            <AlertTitle>Tide release attempt did not succeed</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>{openError}</p>
              <p>If the expected release role was just granted, allow up to 120 seconds and refresh the Tide session. This result is from the real open attempt; the UI does not simulate an ORK refusal.</p>
            </AlertDescription>
          </Alert>
        )}

        {!cycle.sealed ? (
          <div className="space-y-2">
            <Button type="button" className="w-full sm:w-auto" disabled={!canSeal || pending !== null} aria-busy={pending === "seal"} onClick={onSeal}>
              <LockKeyhole aria-hidden="true" />
              {pending === "seal" ? "Sealing release…" : "Seal release"}
            </Button>
            {!canSeal && (
              <p className="text-xs leading-relaxed text-muted-foreground">
                {!authenticated ? "Sign in with Tide to continue." : !canEncrypt ? "The active session has no escrow encryption capability." : !hasWritePolicy ? "Waiting for the stored write policy." : "Waiting for cycle state to synchronize."}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <Button ref={openButtonRef} type="button" className="w-full sm:w-auto" disabled={!canAttempt || pending !== null} aria-busy={pending === "open"} onClick={onAttemptOpen}>
              <PackageOpen aria-hidden="true" />
              {pending === "open" ? "Asking Tide ORKs…" : "Attempt decrypt"}
            </Button>
            {!canAttempt && (
              <p className="text-xs leading-relaxed text-muted-foreground">
                {!authenticated ? "Sign in with Tide to attempt disclosure." : !hasReadPolicy ? "Waiting for the stored read policy before contacting the ORKs." : !hasCiphertext ? "Ciphertext is not available yet." : "Waiting for cycle and artifact state to synchronize."}
              </p>
            )}
            {canAttempt && !canDecrypt && (
              <p className="text-xs leading-relaxed text-warning">
                This session does not currently report the release capability. The button still sends a real open attempt; the ORKs enforce the stored policy.
              </p>
            )}
          </div>
        )}

        <p className="border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
          Tide controls policy-based disclosure. This screen is not financial custody and cannot attest that a modified browser client preserves plaintext confidentiality.
        </p>
      </CardContent>
    </Card>
  );
}
