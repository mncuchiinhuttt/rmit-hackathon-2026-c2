"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function SimulationResetDialog({ disabled, onConfirm }: { disabled: boolean; onConfirm(): Promise<boolean> }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  async function reset() {
    setPending(true);
    try { if (await onConfirm()) setOpen(false); } finally { setPending(false); }
  }
  return (
    <Dialog open={open} onOpenChange={value => { if (!pending) setOpen(value); }}>
      <DialogTrigger asChild><Button type="button" variant="ghost" size="sm" disabled={disabled}><RotateCcw aria-hidden="true" />Reset shared demo</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset the shared SQLite demo?</DialogTitle>
          <DialogDescription>This replaces sample cycles, approvals, redemption and event history for every browser using this server. It cannot be undone. Sample sessions and all real Tide data are unchanged.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline" disabled={pending}>Cancel</Button></DialogClose>
          <Button variant="destructive" disabled={pending} aria-busy={pending} onClick={() => void reset()}>{pending ? "Resetting..." : "Reset shared data"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
