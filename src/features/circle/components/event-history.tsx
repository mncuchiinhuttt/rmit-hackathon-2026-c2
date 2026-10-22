import { Activity } from "lucide-react";

import type { AuditEvent } from "@/features/circle/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EventHistoryProps {
  events: AuditEvent[];
  recordId: string;
}

function formatEventTime(value: string) {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp)
    ? "Time unavailable"
    : new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(timestamp);
}
function latestFirst(left: AuditEvent, right: AuditEvent) {
  const leftTime = Date.parse(left.at);
  const rightTime = Date.parse(right.at);
  return Number.isNaN(leftTime) || Number.isNaN(rightTime) ? 0 : rightTime - leftTime;
}


export function EventHistory({ events, recordId }: EventHistoryProps) {
  const matchingEvents = events.filter((event) => event.recordId === recordId).sort(latestFirst).slice(0, 4);

  return (
    <Card className="bg-card/80">
      <CardHeader className="pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Live record</p>
          <CardTitle role="heading" aria-level={2} className="mt-1 flex items-center gap-2 text-base">
            <Activity className="size-4 text-muted-foreground" aria-hidden="true" />
            Recent events
          </CardTitle>
        </div>
        <p className="font-mono text-xs text-muted-foreground">{recordId}</p>
      </CardHeader>
      <CardContent>
        {matchingEvents.length === 0 ? (
          <p className="rounded-md border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
            No events reported for this release record.
          </p>
        ) : (
          <ul className="divide-y divide-border" aria-label="Recent release events">
            {matchingEvents.map((event) => (
              <li key={event.id} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <p className="min-w-0 text-sm text-foreground">
                  <span className="font-medium">{event.actor}</span>
                  <span className="text-muted-foreground"> · {event.action}</span>
                </p>
                <time className="shrink-0 text-xs text-muted-foreground" dateTime={event.at}>
                  {formatEventTime(event.at)}
                </time>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
