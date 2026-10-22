import { Badge } from "@/components/ui/badge";
import type { GrantSubject, StoredPolicy } from "@/features/releases/types";

function subjectLabel(subject: GrantSubject) {
  if (subject.type === "Role") return `Role · ${subject.id}`;
  if (subject.type === "User") return `User · ${subject.id}`;
  return `Group · ${subject.id}`;
}

function formatExpiration(value: number) {
  const expiration = new Date(value * 1000);
  return Number.isFinite(expiration.getTime())
    ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(expiration)
    : "Expiry unavailable";
}

export function PolicyRow({ label, policy, loading, now }: { label: string; policy: StoredPolicy | null; loading: boolean; now: number }) {
  const active = policy !== null && policy.expiresAt > now;
  const value = loading
    ? "Loading policy…"
    : policy
      ? `${subjectLabel(policy.subject)} · expires ${formatExpiration(policy.expiresAt)}`
      : "No policy returned";
  const status = loading ? "Loading" : !policy ? "Unavailable" : active ? "Active" : "Expired";
  const statusClass = active ? "shrink-0 border-positive/40 text-positive" : policy ? "shrink-0 border-warning/40 text-warning" : "shrink-0 text-muted-foreground";

  return (
    <div className="flex min-w-0 items-start justify-between gap-3 border-t border-border py-3 first:border-t-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="mt-1 break-words font-mono text-xs text-muted-foreground">{value}</p>
      </div>
      <Badge variant="outline" className={statusClass}>{status}</Badge>
    </div>
  );
}
