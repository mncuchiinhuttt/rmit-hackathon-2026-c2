import type { ReactNode } from "react";
import { LogOut, RefreshCw, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DEMO_ACTORS, type DemoCycle, type DemoRole } from "../model";

interface SimulatedSessionHeaderProps {
  actor: DemoRole;
  cycle: DemoCycle;
  onSignOut(): void;
  onRefresh(): void;
  busy: boolean;
  resetControl: ReactNode;
}

export function SimulatedSessionHeader({ actor, cycle, onSignOut, onRefresh, busy, resetControl }: SimulatedSessionHeaderProps) {
  const person = DEMO_ACTORS.find(account => account.id === actor)!;
  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <ShieldCheck className="size-6" aria-hidden="true" />
          <div><p className="text-sm font-semibold">Hostless Hui</p><p className="text-xs text-muted-foreground">Saigon Circle · simulated session</p></div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{person.name}</span><Badge variant="secondary">{person.role}{actor === cycle.beneficiaryUsername ? " · Receiving" : ""}</Badge>
          <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={onRefresh}><RefreshCw aria-hidden="true" />Refresh data</Button>
          {resetControl}
          <Button type="button" variant="outline" size="sm" disabled={busy} onClick={onSignOut}><LogOut aria-hidden="true" />Sign out</Button>
        </div>
      </header>
      <Alert className="border-warning/30 bg-warning/5">
        <AlertTitle>TideCloak simulation</AlertTitle>
        <AlertDescription>Sign-in and approvals use fictional identities. No real money moves. Refresh data to see another member’s saved changes.</AlertDescription>
      </Alert>
    </div>
  );
}
