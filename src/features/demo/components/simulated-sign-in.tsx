"use client";

import { useEffect, useRef, useState } from "react";
import { LogIn, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DEMO_ACTORS, type DemoRole } from "../model";

const ACCOUNT_HELP: Record<DemoRole, string> = {
  minh: "Can open and redeem a release only after two different stewards approve that cycle.",
  hanh: "Can add one approval per cycle. Cannot seal, open or redeem a release.",
  tuan: "Can add one approval per cycle. Cannot seal, open or redeem a release.",
  mai: "Can add one approval per cycle. Cannot seal, open or redeem a release.",
  bao: "Can seal an unsealed sample package. Cannot approve or read the release.",
  operator: "Can inspect the circle and try a denied open. Cannot approve, seal or read a release.",
};

interface SimulatedSignInProps {
  onSignIn(actor: DemoRole): void;
  busy: boolean;
  error: string | null;
  onRetry(): void;
}

export function SimulatedSignIn({ onSignIn, busy, error, onRetry }: SimulatedSignInProps) {
  const [selected, setSelected] = useState<DemoRole>("minh");
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);
  const person = DEMO_ACTORS.find(account => account.id === selected)!;
  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-3xl flex-col justify-center gap-6 px-4 py-8 sm:px-7">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5">
        <p className="flex items-center gap-2 font-semibold"><ShieldCheck className="size-5" aria-hidden="true" />Hostless Hui</p>
        <Badge variant="outline" className="border-warning/40 text-warning">TideCloak simulation</Badge>
      </header>
      <div>
        <h1 ref={heading} tabIndex={-1} className="text-3xl font-semibold tracking-tight">Sign in to Saigon Circle</h1>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted-foreground">Choose a fictional account to test who can seal, approve and open a cycle release. No password or real Tide account is needed.</p>
      </div>
      <Alert className="border-warning/30 bg-warning/5">
        <AlertTitle>Simulated sign-in, not Tide authentication</AlertTitle>
        <AlertDescription>Fictional identities and access rules are simulated on this server. SQLite saves sample changes across reloads and server restarts. No Tide tokens, encryption or payments are involved.</AlertDescription>
      </Alert>
      {error && <Alert variant="destructive"><AlertTitle>SQLite request needs attention</AlertTitle><AlertDescription className="space-y-3"><p>{error}</p><Button variant="outline" size="sm" disabled={busy} onClick={onRetry}>Refresh data</Button></AlertDescription></Alert>}
      <Card>
        <CardHeader>
          <CardTitle role="heading" aria-level={2}>Choose a sample account</CardTitle>
          <CardDescription>Try cycle 3 with different accounts. Operator can reset the shared demo for a fresh run.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={event => { event.preventDefault(); onSignIn(selected); }}>
            <div aria-label="Sample accounts" role="group" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {DEMO_ACTORS.map(account => (
                <Button key={account.id} type="button" disabled={busy} variant={selected === account.id ? "secondary" : "outline"} aria-pressed={selected === account.id} onClick={() => setSelected(account.id)} className="h-auto min-h-16 flex-col gap-1 whitespace-normal py-3">
                  <span>{account.name}</span><span className="text-xs font-normal text-muted-foreground">{account.role}</span>
                </Button>
              ))}
            </div>
            <p className="min-h-10 text-sm text-muted-foreground" role="status">{ACCOUNT_HELP[selected]}</p>
            <Button type="submit" disabled={busy} aria-busy={busy} className="w-full sm:w-auto"><LogIn aria-hidden="true" />{busy ? "Signing in..." : "Sign in as " + person.name + " (simulated)"}</Button>
          </form>
        </CardContent>
      </Card>
      <p className="text-xs leading-relaxed text-muted-foreground">Localhost development only. Anyone using this demo can choose any sample account. Sessions use an HttpOnly cookie; sample accounts cannot access real Tide-protected APIs. SQLite data is shared by browsers on this server.</p>
    </main>
  );
}
