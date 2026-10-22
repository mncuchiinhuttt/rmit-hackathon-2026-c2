"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Fingerprint, KeyRound, ShieldCheck } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChangeRequestCard } from "@/features/governance/components/change-request-card";
import { PolicyRow } from "@/features/releases/components/policy-row";
import type { GovernanceSnapshot } from "@/features/governance/types";
import type { ReleaseArtifact } from "@/features/releases/types";

const TIDE_CONSOLE_URL = "http://localhost:8080/realms/hui-rmit26/tide-console/";

function formatVerifiedTime(value: string) {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp)
    ? "Time unavailable"
    : new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(timestamp);
}

interface ProofPanelProps {
  recordId: string;
  artifact: ReleaseArtifact | null;
  governance: GovernanceSnapshot | null;
  authenticated: boolean;
  isSteward: boolean;
  loading: boolean;
  policyPending: boolean;
  policyError: string | null;
  onCreatePolicies(): void;
}

export function ProofPanel({
  recordId,
  artifact,
  governance,
  authenticated,
  isSteward,
  loading,
  policyPending,
  policyError,
  onCreatePolicies,
}: ProofPanelProps) {
  const requests = governance?.requests.filter((entry) => entry.recordIds.includes(recordId)) ?? [];
  const [now, setNow] = useState(() => Date.now() / 1000);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now() / 1000), 15_000);
    return () => window.clearInterval(timer);
  }, []);
  const allPoliciesStored = Boolean(artifact?.readPolicy && artifact.writePolicy);
  const policiesCurrent = Boolean(artifact?.readPolicy && artifact.readPolicy.expiresAt > now && (artifact.cycle.sealed || artifact.writePolicy && artifact.writePolicy.expiresAt > now));
  const canCreate = authenticated && isSteward && artifact !== null && !policiesCurrent && (!artifact.cycle.sealed || Boolean(artifact.readPolicy));

  return (
    <Card className="relative overflow-hidden border-white/10 bg-card/90">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Enforcement evidence</p>
            <CardTitle role="heading" aria-level={2} className="mt-1 flex items-center gap-2 text-lg">
              <Fingerprint className="size-4 text-muted-foreground" aria-hidden="true" />
              What Tide stores
            </CardTitle>
          </div>
          <Badge variant="outline" className={artifact ? "shrink-0 border-positive/40 text-positive" : "shrink-0 text-muted-foreground"}>{artifact ? "Live response" : loading ? "Syncing" : "No artifact"}</Badge>
        </div>
        <CardDescription>
          The application receives ciphertext and policy metadata. Tide ORKs evaluate access when a session attempts to open it.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <section aria-labelledby="artifact-heading">
          <h3 id="artifact-heading" className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
            <KeyRound className="size-3.5" aria-hidden="true" />
            Package metadata
          </h3>
          <div className="rounded-lg border border-border bg-background/60 px-3">
            <div className="flex items-start justify-between gap-3 py-3">
              <span className="text-sm text-muted-foreground">Record</span>
              <code className="break-all text-right font-mono text-xs text-foreground">{recordId}</code>
            </div>
            <div className="flex items-start justify-between gap-3 border-t border-border py-3">
              <span className="text-sm text-muted-foreground">Ciphertext</span>
              <span className="text-right text-sm tabular-nums text-foreground">
                {artifact ? `${artifact.cycle.ciphertextBytes.toLocaleString("en")} bytes` : loading ? "Loading…" : "Not available"}
              </span>
            </div>
          </div>
          <div className="mt-3 rounded-lg border border-border bg-background/60 px-3">
            <PolicyRow label="Read grant" policy={artifact?.readPolicy ?? null} loading={loading && artifact === null} now={now} />
            <PolicyRow label="Write grant" policy={artifact?.writePolicy ?? null} loading={loading && artifact === null} now={now} />
          </div>
        </section>

        <section aria-labelledby="governance-heading" className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 id="governance-heading" className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              Tide approval history
            </h3>
            {isSteward && <Badge variant="outline">Steward view</Badge>}
          </div>

          {loading && isSteward ? (
            <Skeleton className="h-16 w-full" />
          ) : !authenticated || !isSteward ? (
            <p className="rounded-lg border border-border bg-background/60 p-3 text-sm leading-relaxed text-muted-foreground">
              Approval counts are not available in this session. Tide change requests are shown only to authenticated stewards; the count is intentionally unknown here.
            </p>
          ) : requests.length > 0 ? (
            <>
              {governance && (
                <p className="text-xs text-muted-foreground">
                  Verified <time dateTime={governance.verifiedAt}>{formatVerifiedTime(governance.verifiedAt)}</time>
                </p>
              )}
              <ul className="space-y-2" aria-label="Pending and approved Tide changes for this cycle role">
                {requests.map((request) => <ChangeRequestCard key={request.id} request={request} />)}
              </ul>
            </>
          ) : governance ? (
            <p className="rounded-lg border border-border bg-background/60 p-3 text-sm leading-relaxed text-muted-foreground">
              No pending or approved change for this cycle role was returned. Approval count is unknown, not zero.
            </p>
          ) : (
            <p className="rounded-lg border border-border bg-background/60 p-3 text-sm leading-relaxed text-muted-foreground">
              Live approval state is unavailable. No quorum count is inferred.
            </p>
          )}

          {policyError && (
            <Alert variant="destructive">
              <AlertTitle>Policy creation failed</AlertTitle>
              <AlertDescription>{policyError}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-2">
            {isSteward && (
              <>
                <Button type="button" className="w-full" disabled={!canCreate || policyPending} onClick={onCreatePolicies}>
                  <ShieldCheck aria-hidden="true" />
                  {policiesCurrent ? "Read access policy current" : policyPending ? "Requesting Tide signature…" : artifact?.cycle.sealed ? "Renew read policy through Tide" : allPoliciesStored ? "Renew expired policies through Tide" : artifact?.readPolicy || artifact?.writePolicy ? "Complete policy set" : "Create release policies"}
                </Button>
                {authenticated && !policiesCurrent && (
                  <p className="text-xs leading-relaxed text-muted-foreground">Requires the active Tide steward session and enclave. No approval is simulated in this app.</p>
                )}
                {artifact?.cycle.sealed && <p className="text-xs text-muted-foreground">After sealing, renewal replaces only the expired read policy. Ciphertext and the write grant stay unchanged.</p>}
              </>
            )}
            {isSteward && authenticated && (
              <a
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                href={TIDE_CONSOLE_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="size-4" aria-hidden="true" />
                Open Tide Console
              </a>
            )}
          </div>

          <p className="border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">
            Role changes can take up to 120 seconds to reach session claims. Refresh the Tide session to check propagation; the ORKs, not this screen, enforce the policy. This prototype does not prove browser-client integrity or provide financial custody.
          </p>
        </section>
      </CardContent>
    </Card>
  );
}
