"use client";

import type { CycleSummary } from "@/features/circle/types";
import { Button } from "@/components/ui/button";

interface CycleSelectorProps {
  cycles: CycleSummary[];
  selectedRecordId: string;
  disabled?: boolean;
  onSelect(recordId: string): void;
}

export function CycleSelector({ cycles, selectedRecordId, disabled = false, onSelect }: CycleSelectorProps) {
  return (
    <nav aria-label="Select release cycle" className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Cycle</span>
      {cycles.map((cycle) => {
        const selected = cycle.recordId === selectedRecordId;
        return (
          <Button
            key={cycle.recordId}
            type="button"
            size="sm"
            variant={selected ? "secondary" : "ghost"}
            aria-pressed={selected}
            aria-label={`Cycle ${cycle.number}${cycle.sealed ? ", release sealed" : ", not sealed"}`}
            disabled={disabled}
            onClick={() => onSelect(cycle.recordId)}
          >
            {String(cycle.number).padStart(2, "0")}
          </Button>
        );
      })}
    </nav>
  );
}
