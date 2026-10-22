import Link from "next/link";
import { RotateCcw, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DEMO_ACTORS, type DemoRole } from "../model";

interface DemoHeaderProps {
  actor: DemoRole;
  onActorChange(actor: DemoRole): void;
  onReset(): void;
}

export function DemoHeader({ actor, onActorChange, onReset }: DemoHeaderProps) {
  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex items-center gap-3">
          <ShieldCheck className="size-6 text-foreground" aria-hidden="true" />
          <div><p className="text-sm font-semibold tracking-wide">Hostless Hui</p><p className="text-xs text-muted-foreground">Saigon Circle · product preview</p></div>
          <Badge variant="outline" className="border-warning/40 text-warning">Offline demo</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={onReset}><RotateCcw aria-hidden="true" />Reset demo</Button>
          <Button asChild variant="outline" size="sm"><Link href="/" prefetch={false}>Return to app</Link></Button>
        </div>
      </header>
      <Alert className="border-warning/30 bg-warning/5">
        <p className="mb-1 font-medium">Demo mode — no Tide connection</p>
        <AlertDescription>Fictional data. Role changes, approvals, opening and redemption are simulated in this tab. Reload or reset to start over.</AlertDescription>
      </Alert>
      <nav aria-label="Preview as" className="flex flex-wrap items-center gap-2">
        <span className="mr-2 text-xs uppercase tracking-widest text-muted-foreground">View as</span>
        {DEMO_ACTORS.map(person => (
          <Button key={person.id} size="sm" variant={actor === person.id ? "secondary" : "ghost"} aria-pressed={actor === person.id} onClick={() => onActorChange(person.id)}>
            {person.name}<span className="font-normal text-muted-foreground">· {person.role}</span>
          </Button>
        ))}
      </nav>
    </div>
  );
}
