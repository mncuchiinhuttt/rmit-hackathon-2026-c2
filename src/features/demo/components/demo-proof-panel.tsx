import { Check, Fingerprint, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DEMO_ACTORS, isDemoSteward, type DemoCycle, type DemoRole } from "../model";

interface DemoProofPanelProps {
  cycle: DemoCycle;
  actor: DemoRole;
  error: string | null;
  onApprove(): void;
  requireSignIn?: boolean;
  disabled?: boolean;
}

export function DemoProofPanel({ cycle, actor, error, onApprove, requireSignIn = false, disabled = false }: DemoProofPanelProps) {
  const approved = cycle.approvals.length >= 2;
  const alreadyVoted = cycle.approvals.includes(actor);
  const canApprove = !disabled && isDemoSteward(actor) && cycle.sealed && !approved && !alreadyVoted;
  const switchAccount = requireSignIn ? "Sign out, then sign in as " : "Switch to ";
  return (
    <Card className="border-white/10 bg-card/90">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Sample workflow</p>
            <CardTitle className="mt-1 flex items-center gap-2 text-lg"><Fingerprint className="size-4" aria-hidden="true" />Release approvals</CardTitle>
          </div>
          <Badge variant="outline" className="border-warning/40 text-warning">Simulated</Badge>
        </div>
        <CardDescription>Two distinct sample stewards approve access for this cycle. These local decisions have no effect on Tide or the live app.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <dl className="grid grid-cols-[1fr_auto] gap-3 rounded-lg border border-border bg-background/60 p-3 text-sm">
          <dt className="text-muted-foreground">Record</dt><dd className="font-mono text-xs">{cycle.recordId}</dd>
          <dt className="text-muted-foreground">Reader</dt><dd>Minh</dd>
          <dt className="text-muted-foreground">Approvers</dt><dd>Hanh, Tuan, Mai</dd>
          <dt className="text-muted-foreground">Package</dt><dd>{cycle.sealed ? "Sample sealed" : "Not sealed"}</dd>
        </dl>
        <section aria-label="Demo approval progress" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium">{cycle.approvals.length} of 2 demo approvals</p>
            <Badge variant="outline" className={approved ? "border-positive/40 text-positive" : "border-warning/40 text-warning"}>{approved ? "Demo access approved" : "Awaiting demo approvals"}</Badge>
          </div>
          <Progress value={cycle.approvals.length / 2 * 100} aria-label={cycle.approvals.length + " of 2 demo approvals"} />
          <ul className="space-y-2 text-sm">
            {DEMO_ACTORS.filter(person => isDemoSteward(person.id)).map(person => (
              <li key={person.id} className="flex items-center justify-between gap-2">
                <span>{person.name}</span>
                <span className={cycle.approvals.includes(person.id) ? "inline-flex items-center gap-1 text-positive" : "text-muted-foreground"}>
                  {cycle.approvals.includes(person.id) && <Check className="size-3.5" aria-hidden="true" />}
                  {cycle.approvals.includes(person.id) ? "Demo approved" : "Not approved"}
                </span>
              </li>
            ))}
          </ul>
          <Button className="w-full" disabled={!canApprove} onClick={onApprove}>
            <ShieldCheck aria-hidden="true" />{approved ? "Two demo approvals recorded" : alreadyVoted ? "Already approved as " + actor : "Approve as " + actor}
          </Button>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {!cycle.sealed ? switchAccount + "Bao and seal the package first." : approved ? actor === "minh" ? "Open the sample package using the release card." : switchAccount + "Minh and open the sample package." : !isDemoSteward(actor) ? switchAccount + "Hanh, Tuan or Mai to add an approval." : alreadyVoted ? switchAccount + "a different steward. One person cannot supply both approvals." : "Add your approval, then " + switchAccount.toLowerCase() + "a different steward."}
          </p>
        </section>
        {error && <Alert variant="destructive"><AlertTitle>Demo approval denied</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
        <section className="space-y-2 border-t border-border pt-4">
          <h3 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Sample package data</h3>
          <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded-md bg-background/60 p-3 font-mono text-xs text-muted-foreground">{cycle.sealed ? "DEMO_ONLY: " + cycle.recordId : "No sample package stored."}</pre>
          <p className="text-xs text-muted-foreground">Placeholder text, not encrypted data or a signed Tide policy.</p>
        </section>
      </CardContent>
    </Card>
  );
}
