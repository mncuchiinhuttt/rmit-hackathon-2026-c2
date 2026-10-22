import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { ChangeRequestView } from "@/features/governance/types";

export function ChangeRequestCard({ request }: { request: ChangeRequestView }) {
  const hasCount = Number.isInteger(request.authorizationCount) && request.authorizationCount >= 0 && Number.isInteger(request.threshold) && request.threshold > 0;
  const progress = hasCount ? Math.min(100, Math.max(0, request.authorizationCount / request.threshold * 100)) : undefined;
  const approved = request.status === "APPROVED";

  return (
    <li className="rounded-lg border border-border bg-background/60 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-all font-mono text-xs text-muted-foreground">{request.id}</p>
          <p className="mt-1 text-sm font-medium text-foreground">Tide change request · {request.status}</p>
        </div>
        <Badge variant="outline" className={approved || request.readyToCommit ? "shrink-0 border-positive/40 text-positive" : "shrink-0 border-warning/40 text-warning"}>
          {approved ? "Approved" : request.readyToCommit ? "Ready to commit" : "Awaiting quorum"}
        </Badge>
      </div>

      {hasCount ? (
        <>
          <p className="mt-3 text-sm text-foreground">{request.authorizationCount} of {request.threshold} authorizations</p>
          <Progress value={progress} aria-label={`${request.authorizationCount} of ${request.threshold} actual authorizations`} className="mt-2" />
        </>
      ) : (
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Authorization count or threshold is unavailable. Quorum count is unknown.
        </p>
      )}
    </li>
  );
}
