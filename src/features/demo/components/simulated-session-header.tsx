import type { ReactNode } from "react";
import { LogOut, RefreshCw, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { demoRealmRoles } from "../fixtures";
import { DEMO_ACTORS, isDemoSteward, type DemoCycle, type DemoRole } from "../model";

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
  const roles = demoRealmRoles(actor, cycle);
  if (isDemoSteward(actor)) roles.push("realm-management:tide-realm-admin");
  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <ShieldCheck className="size-6" aria-hidden="true" />
          <div><p className="text-sm font-semibold">Hostless Hui</p><p className="text-xs text-muted-foreground">Saigon Circle · simulated session</p></div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{person.name}</span><Badge variant="secondary">{person.role}</Badge>
          <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={onRefresh}><RefreshCw aria-hidden="true" />Refresh data</Button>
          {resetControl}
          <Button type="button" variant="outline" size="sm" disabled={busy} onClick={onSignOut}><LogOut aria-hidden="true" />Sign out</Button>
        </div>
      </header>
      <Alert className="border-warning/30 bg-warning/5">
        <AlertTitle>TideCloak simulation — no live authentication</AlertTitle>
        <AlertDescription>SQLite-backed simulation. The server checks sample roles and saves changes across browsers, reloads and restarts. Accounts are freely selectable; this is not Tide authentication or ORK enforcement. Refresh data for the latest shared state.</AlertDescription>
      </Alert>
      <section aria-label="Simulated session roles" className="space-y-2 text-xs text-muted-foreground">
        <p>Simulated roles for the selected cycle</p>
        <div className="flex flex-wrap gap-2">{roles.map(role => <code key={role} className="max-w-full break-all rounded bg-secondary px-2 py-1">{role}</code>)}</div>
      </section>
    </div>
  );
}
