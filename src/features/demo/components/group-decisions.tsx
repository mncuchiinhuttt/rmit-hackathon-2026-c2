import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DEMO_ACTORS, isDemoSteward, type DemoCycle, type DemoRole, type DemoState } from "../model";
import type { ChangeKind } from "../governance-types";
import type { SimulationCommand } from "../simulation-contract";

const name = (id: DemoRole) => DEMO_ACTORS.find(person => person.id === id)!.name;
export function GroupDecisions({ state, cycle, actor, busy, onCommand, now }: { state: DemoState; cycle: DemoCycle; actor: DemoRole; busy: boolean; onCommand(command: SimulationCommand): void; now: number }) {
  const changes = state.changes.filter(change => change.recordId === cycle.recordId).slice().reverse();
  const needsRenewal = cycle.policyRevoked || cycle.policyExpiresAt <= now;
  const firstReview = changes.find(change => change.status === "pending" && isDemoSteward(actor) && change.proposedBy !== actor && !change.approvals.includes(actor));
  function propose(kind: ChangeKind) { onCommand({ type: "propose", kind, recordId: cycle.recordId, target: kind === "grant" ? actor : null }); }
  return (
    <Card>
      <CardHeader>
        <CardTitle role="heading" aria-level={2}>Group decisions</CardTitle>
        <CardDescription>Two different stewards must approve. A proposer cannot approve their own change. Pending is not permission.</CardDescription>
        <Badge variant="outline" className="w-fit border-warning/40 text-warning">Simulated governance</Badge>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm">Receiving this turn: <strong>{cycle.beneficiary}</strong>. Recorded reader grants: {cycle.readers.length ? cycle.readers.map(name).join(", ") : "none"}.{cycle.policyRevoked ? " Policy revoked: renew it, then request new reader grants." : needsRenewal ? " Policy expired: renew it before using these grants." : ""}</p>
        <div className="flex flex-col gap-2">
          <Button variant={firstReview ? "outline" : "default"} disabled={busy || !cycle.sealed || needsRenewal || cycle.readers.includes(actor)} onClick={() => propose("grant")}>{actor === cycle.beneficiaryUsername ? "Request my release" : "Propose read access for myself"}</Button>
          {needsRenewal && <Button disabled={busy || !cycle.sealed} onClick={() => propose("renew")}>Request governed renewal</Button>}
        </div>
        {state.error?.operation === "policies" && <p role="alert" className="text-sm text-destructive">{state.error.message}</p>}
        <section aria-label="Cycle change requests" className="space-y-4">
          {!changes.length && <p className="text-sm text-muted-foreground">No proposal for this cycle yet. A scheduled recipient or another reader can request access; no grant is applied automatically.</p>}
          {changes.map(change => {
            const scope = change.kind === "grant" ? `Read access for ${name(change.target!)}` : change.kind === "renew" ? "Renew same-scope policy for 48 hours" : "Revoke all reader access for this cycle";
            const canVote = change.status === "pending" && isDemoSteward(actor) && change.proposedBy !== actor && !change.approvals.includes(actor);
            return <article key={change.id} className="space-y-2 border-t border-border pt-4">
              <div className="flex flex-wrap items-start justify-between gap-2"><h3 className="text-sm font-semibold">{scope}</h3><Badge variant="outline" className={change.status === "committed" ? "text-positive" : "text-warning"}>{change.status === "pending" ? "Pending · not applied" : change.status === "committed" ? "Committed · applied" : "Superseded · re-propose"}</Badge></div>
              <p className="text-sm text-muted-foreground">Proposed by {name(change.proposedBy)} · cycle {cycle.number} · policy v{change.baseVersion}.</p>
              <p className="text-sm">Approved by {change.approvals.length ? change.approvals.map(name).join(", ") : "no one yet"} ({change.approvals.length}/2).</p>
              {change.status === "pending" && <><Button variant={firstReview?.id === change.id ? "default" : "outline"} disabled={busy || !canVote} onClick={() => onCommand({ type: "vote", requestId: change.id })}>Approve {change.kind} proposed by {name(change.proposedBy)}</Button><p className="text-xs text-muted-foreground">{change.proposedBy === actor ? "Ask two other stewards to review your proposal." : change.approvals.includes(actor) ? "Your vote is recorded. Another steward must review independently." : !isDemoSteward(actor) ? "Only Hanh, Tuan and Mai may vote; operating the app does not count." : "Check the reader, cycle and effect before approving."}</p></>}
              {change.committedAt && <p className="text-xs text-muted-foreground">Committed {new Date(change.committedAt).toLocaleString("en")}. {change.kind === "revoke" ? "Previously viewed or copied codes cannot be recalled." : "Other pending requests for the old version must be proposed again."}</p>}
            </article>;
          })}
        </section>
        <details className="border-t border-border pt-4">
          <summary className="cursor-pointer text-sm font-medium">Manage access lifetime</summary>
          <p className="mt-3 text-xs text-muted-foreground">Renewal extends the same cycle for 48 hours. Revocation stops future opens; it cannot recall codes already viewed. Each change needs two independent approvals.</p>
          <div className="mt-3 flex flex-col gap-2">
            {!needsRenewal && <Button variant="outline" disabled={busy || !cycle.sealed} onClick={() => propose("renew")}>Request governed renewal</Button>}
            <Button variant="ghost" disabled={busy || !cycle.sealed || cycle.policyRevoked} onClick={() => propose("revoke")}>Propose revoking cycle access</Button>
          </div>
        </details>
      </CardContent>
    </Card>
  );
}
