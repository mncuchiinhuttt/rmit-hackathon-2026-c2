import { Button } from "@/components/ui/button";
import { DEMO_ACTORS, demoOpenError, isDemoSteward, type DemoCycle, type DemoRole, type DemoState } from "../model";

export function CircleStory({ state, cycle, actor, busy, onSelect, now }: { state: DemoState; cycle: DemoCycle; actor: DemoRole; busy: boolean; onSelect(id: string): void; now: number }) {
  const denied = demoOpenError(cycle, actor, now);
  const pending = state.changes.filter(change => change.recordId === cycle.recordId && change.status === "pending");
  const turns = state.cycles.filter(turn => turn.beneficiaryUsername === actor).map(turn => turn.number).join(", ");
  const roleDescription = actor === "operator"
    ? denied ? "Hosting gives you no default reader or voting rights. Try opening, then propose access for yourself: the proposal alone changes nothing." : "The group committed a reader grant for you on this cycle. You may now open it; you still cannot vote or redeem another member's turn."
    : isDemoSteward(actor) ? "You may review and approve changes proposed by others. Your vote alone cannot apply a change or let you read a release."
    : actor === "bao" ? `You seal packages${turns ? ` and receive cycle ${turns}` : ""}. Sealing does not grant read access: independent stewards must approve your request.`
    : `You receive cycles ${turns || "not yet assigned"}. Request your release, wait for committed approval, then open and redeem once.`;
  const next = !cycle.sealed ? "Bao seals this turn's sample package first."
    : cycle.policyRevoked || cycle.policyExpiresAt <= now ? "Request a policy renewal below; two stewards must approve it. Revoked reader grants must be requested again."
    : pending.length ? `${pending.length} change awaiting independent steward review. ${denied ? "A pending request does not grant access." : "Your current reader grant stays in effect until a change commits or expires."}`
    : denied ? actor === cycle.beneficiaryUsername ? "Request your release below, then ask two different stewards to approve." : `This turn belongs to ${cycle.beneficiary}. Another turn's access does not carry over.`
    : cycle.redeemed ? "This sample release is already redeemed; it cannot pay out a second time." : "Your reader grant is committed. You can open the package below.";
  return (
    <section className="space-y-5">
      <div>
        <h1 id="circle-workspace-heading" tabIndex={-1} className="text-3xl font-semibold tracking-tight">Saigon Circle</h1>
        <p className="mt-2 max-w-prose text-sm text-muted-foreground">Cycle {cycle.number}: <strong className="text-foreground">{cycle.beneficiary} receives this turn.</strong> Six members contribute ₫1,000,000 each toward the fictional ₫6,000,000 release. Hosting the app gives no automatic reader or approval rights.</p>
      </div>
      <ol aria-label="How this circle works" className="grid gap-2 text-sm sm:grid-cols-5">
        {["Group contributes", "A member's turn arrives", "Recipient requests access", "Stewards review", "Recipient opens code"].map((step, index) => <li key={step} className="flex gap-2"><span className="text-muted-foreground">{index + 1}.</span>{step}</li>)}
      </ol>
      <section aria-label="Your role and next step" className="rounded-lg border border-border bg-card p-4">
        <h2 className="font-semibold">What you can do</h2>
        <p className="mt-2 text-sm">{roleDescription}</p>
        <p className="mt-2 text-sm font-medium text-warning">Next: {next}</p>
      </section>
      <section aria-label="Members and receiving schedule">
        <h2 className="font-semibold">Members & receiving schedule</h2>
        <p className="mt-1 text-xs text-muted-foreground">{DEMO_ACTORS.map(person => person.name).join(", ")} · selected demo turns below · all contributions and funds are simulated.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {state.cycles.map(turn => <Button key={turn.recordId} variant={cycle.recordId === turn.recordId ? "secondary" : "outline"} disabled={busy} aria-pressed={cycle.recordId === turn.recordId} onClick={() => onSelect(turn.recordId)}>Cycle {turn.number} · {turn.beneficiary}</Button>)}
        </div>
      </section>
    </section>
  );
}
