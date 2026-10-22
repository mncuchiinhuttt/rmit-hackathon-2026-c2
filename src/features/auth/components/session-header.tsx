"use client";

import { KeyRound, LogIn, LogOut, RefreshCw, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface SessionHeaderProps {
  authenticated: boolean;
  initializing: boolean;
  username: string | null;
  isSteward: boolean;
  canEncrypt: boolean;
  canDecrypt: boolean;
  refreshing: boolean;
  loggingOut: boolean;
  onLogin(): void;
  onLogout(): void;
  onRefresh(): void;
}

export function SessionHeader({
  authenticated,
  initializing,
  username,
  isSteward,
  canEncrypt,
  canDecrypt,
  refreshing,
  loggingOut,
  onLogin,
  onLogout,
  onRefresh,
}: SessionHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div aria-hidden="true" className="flex size-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-foreground">
          <ShieldCheck className="size-5" />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-wide text-foreground">Hostless Hui</p>
          <p className="text-xs text-muted-foreground">Saigon Circle · Tide-governed release</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        {initializing ? (
          <span className="text-sm text-muted-foreground" role="status">Checking Tide session…</span>
        ) : authenticated ? (
          <>
            <span className="mr-1 inline-flex items-center gap-2 text-sm text-foreground">
              <span className="size-1.5 rounded-full bg-positive" aria-hidden="true" />
              <span>{username || "Signed in"}</span>
            </span>
            {isSteward && <Badge variant="outline" className="border-positive/40 text-positive">Steward</Badge>}
            {canEncrypt && <Badge variant="outline" className="border-warning/40 text-warning">Escrow</Badge>}
            {canDecrypt && <Badge variant="outline" className="border-positive/40 text-positive">Release role</Badge>}
            <Button type="button" size="sm" variant="ghost" onClick={onRefresh} disabled={refreshing} aria-busy={refreshing}>
              <RefreshCw className={refreshing ? "animate-spin" : ""} aria-hidden="true" />
              Refresh session
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={onLogout} disabled={loggingOut} aria-busy={loggingOut}>
              <LogOut aria-hidden="true" />
              {loggingOut ? "Signing out…" : "Sign out"}
            </Button>
          </>
        ) : (
          <>
            <span className="mr-1 inline-flex items-center gap-2 text-sm text-muted-foreground">
              <KeyRound className="size-4" aria-hidden="true" />
              No Tide session
            </span>
            <Button type="button" size="sm" onClick={onLogin}>
              <LogIn aria-hidden="true" />
              Sign in with Tide
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
