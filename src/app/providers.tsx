"use client";

import { TideCloakProvider } from "@tidecloak/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { AuthMode } from "@/features/auth/mode";

type BrowserConfig = Record<string, unknown>;

export function Providers({ children, mode }: { children: React.ReactNode; mode: AuthMode }) {
  const pathname = usePathname();
  if (mode === 'simulated' || pathname === '/demo') return children;
  return <SecureProviders>{children}</SecureProviders>;
}

function SecureProviders({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<BrowserConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    // The SDK cookie bridge is patched out; remove legacy copies before auth initializes.
    document.cookie = 'kcToken=; Path=/; Max-Age=0; SameSite=Lax';
    const controller = new AbortController();
    async function load() {
      setError(null);
      try {
        const response = await fetch('/api/config', { signal: controller.signal, cache: 'no-store' });
        if (!response.ok) throw new Error('Tide setup is unavailable. Check the local realm configuration.');
        const value = await response.json();
        if (!value || typeof value.realm !== 'string' || typeof value.resource !== 'string' || !value.jwk) {
          throw new Error('The Tide adapter is incomplete. Export it again from the prepared realm.');
        }
        setConfig({ ...value, useDPoP: { mode: 'strict', alg: 'ES256' } });
      } catch (cause) {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Unable to load secure configuration');
      }
    }
    void load();
    return () => controller.abort();
  }, [attempt]);

  if (!config) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-5 px-6 text-foreground">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Hostless Hui</p>
        <h1 className="text-3xl font-semibold tracking-tight">{error ? 'Secure setup needs attention' : 'Connecting to your circle'}</h1>
        <p role={error ? 'alert' : 'status'} className="text-sm leading-relaxed text-muted-foreground">
          {error ?? 'Loading the verified Tide realm configuration. No private data is shown before authentication.'}
        </p>
        {error && (
          <div className="flex flex-wrap gap-3">
            <Button asChild><Link href="/demo">Preview app without Tide</Link></Button>
            <Button variant="outline" onClick={() => setAttempt(value => value + 1)}>Check setup again</Button>
          </div>
        )}
      </main>
    );
  }
  return <TideCloakProvider config={config}>{children}</TideCloakProvider>;
}
