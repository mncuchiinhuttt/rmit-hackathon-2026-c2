import { Check, WalletCards } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface RedemptionActionProps {
  eligible: boolean;
  redeemed: boolean;
  pending: boolean;
  error: string | null;
  onRedeem(): void;
}

export function RedemptionAction({ eligible, redeemed, pending, error, onRedeem }: RedemptionActionProps) {
  if (redeemed) {
    return (
      <Alert className="border-positive/40 bg-positive/5">
        <Check className="text-positive" aria-hidden="true" />
        <AlertTitle>Synthetic redemption recorded</AlertTitle>
        <AlertDescription>
          The app accepted the beneficiary’s code for this record. No real money was transferred.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Redemption was not recorded</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {eligible ? (
        <Button type="button" className="w-full" disabled={pending} onClick={onRedeem}>
          <WalletCards aria-hidden="true" />
          {pending ? "Recording redemption…" : "Redeem synthetic release"}
        </Button>
      ) : (
        <p className="rounded-md border border-border bg-background/60 px-3 py-2 text-sm leading-relaxed text-muted-foreground">
          Redemption is available only to the authenticated beneficiary for this cycle.
        </p>
      )}
    </div>
  );
}
