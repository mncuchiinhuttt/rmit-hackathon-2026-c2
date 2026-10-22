"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EMPTY_SIMULATION, type SimulationCommand } from "../simulation-contract";
import { parseSimulationView } from "./parse-simulation-view";

async function loadSimulation(signal: AbortSignal, command?: SimulationCommand) {
  const response = await fetch("/api/simulation", {
    method: command ? "POST" : "GET", cache: "no-store", credentials: "same-origin",
    headers: command ? { "Content-Type": "application/json" } : undefined,
    body: command ? JSON.stringify(command) : undefined,
    signal: AbortSignal.any([signal, AbortSignal.timeout(15_000)]),
  });
  const value: unknown = await response.json();
  if (!response.ok && !(response.status === 403 && value && typeof value === "object" && "actor" in value)) {
    const message = value && typeof value === "object" && "error" in value && typeof value.error === "string" ? value.error : "SQLite request was not confirmed. Refresh data before trying again.";
    throw new Error(message);
  }
  return parseSimulationView(value);
}

export function useSqliteSimulation() {
  const [view, setView] = useState(EMPTY_SIMULATION);
  const [busy, setBusy] = useState(true);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const active = useRef<AbortController | null>(null);
  const generation = useRef(0);

  const request = useCallback(async (command?: SimulationCommand) => {
    if (active.current) return null;
    const controller = new AbortController();
    active.current = controller;
    const current = ++generation.current;
    setBusy(true);
    setError(null);
    try {
      const next = await loadSimulation(controller.signal, command);
      if (current !== generation.current) return null;
      setView(next);
      return next;
    } catch (cause) {
      if (current === generation.current) {
        setView(EMPTY_SIMULATION);
        setError(cause instanceof Error ? cause.message : "SQLite is unavailable. Refresh to retry.");
      }
      return null;
    } finally {
      if (current === generation.current) {
        active.current = null;
        setBusy(false);
        setInitializing(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    active.current = controller;
    const current = ++generation.current;
    void loadSimulation(controller.signal).then(
      next => { if (current === generation.current) setView(next); },
      cause => { if (current === generation.current) setError(cause instanceof Error ? cause.message : "SQLite is unavailable. Refresh to retry."); },
    ).finally(() => {
      if (current === generation.current) { active.current = null; setBusy(false); setInitializing(false); }
    });
    return () => { generation.current += 1; active.current?.abort(); active.current = null; };
  }, []);

  return { view, busy, initializing, error, request };
}
