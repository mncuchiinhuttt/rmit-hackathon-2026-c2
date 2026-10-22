import { demoRealmRoles } from "../fixtures";
import { isDemoSteward, type DemoCycle, type DemoRole } from "../model";

export function EvidenceDetails({ actor, cycle, now }: { actor: DemoRole; cycle: DemoCycle; now: number }) {
  const roles = demoRealmRoles(actor, cycle);
  if (isDemoSteward(actor)) roles.push("realm-management:tide-realm-admin");
  return (
    <details className="rounded-lg border border-border bg-card p-4 text-sm">
      <summary className="cursor-pointer font-medium">Evidence details</summary>
      <dl className="mt-4 grid gap-2 sm:grid-cols-[10rem_1fr]">
        <dt className="text-muted-foreground">Enforcement used</dt><dd>SQLite transaction and simulated identities — not Tide/ORK proof.</dd>
        <dt className="text-muted-foreground">Record / version</dt><dd className="font-mono text-xs">{cycle.recordId} / v{cycle.policyVersion}</dd>
        <dt className="text-muted-foreground">Policy state</dt><dd>{cycle.policyRevoked ? "Revoked" : cycle.policyExpiresAt <= now ? "Expired" : "Active"} · expires {new Date(cycle.policyExpiresAt * 1000).toLocaleString("en")}</dd>
        <dt className="text-muted-foreground">Simulated claims</dt><dd className="break-all font-mono text-xs">{roles.join(", ")}</dd>
      </dl>
      <p className="mt-4 text-muted-foreground">Renewal needs two independent approvals and preserves cycle scope. Revocation removes future reader grants here; renewal does not restore revoked readers. Neither expiry nor revocation erases a code already viewed or copied.</p>
      <p className="mt-3 text-muted-foreground">Still to prove on Tide: separate enrolled identities, actual quorum, same-ciphertext/same-policy denials and success, alternate-policy bypass attempts, renewal, role removal and propagation. SQLite results do not satisfy that evidence.</p>
    </details>
  );
}
