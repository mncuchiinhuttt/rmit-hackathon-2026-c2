"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiGet } from "@/lib/client/tide-api";
import { useTideSession } from "@/features/auth/client/use-tide-session";
import type { CircleMember } from "@/features/auth/types";
import type { CircleSnapshot } from "@/features/circle/types";
import type { ReleaseArtifact } from "@/features/releases/types";
import type { GovernanceSnapshot } from "@/features/governance/types";

interface LoadedCircle {
  key: string;
  snapshot: CircleSnapshot | null;
  artifact: ReleaseArtifact | null;
  governance: GovernanceSnapshot | null;
  members: CircleMember[];
  error: string | null;
}

export interface CircleClientState {
  snapshot: CircleSnapshot | null;
  artifact: ReleaseArtifact | null;
  governance: GovernanceSnapshot | null;
  members: CircleMember[];
  loading: boolean;
  error: string | null;
  selectedRecordId: string;
  selectRecord(recordId: string): void;
  refresh(): Promise<void>;
}

async function loadCircle(key: string, recordId: string, isSteward: boolean): Promise<LoadedCircle> {
  const [snapshot, artifact] = await Promise.all([
    apiGet<CircleSnapshot>('/api/circle'),
    apiGet<ReleaseArtifact>(`/api/payouts?recordId=${encodeURIComponent(recordId)}`),
  ]);
  if (!Array.isArray(snapshot.cycles) || !snapshot.session?.sub || artifact.cycle?.recordId !== recordId) {
    throw new Error('The circle API returned an invalid response');
  }
  let governance: GovernanceSnapshot | null = null;
  let members: CircleMember[] = [];
  if (isSteward) {
    [governance, members] = await Promise.all([
      apiGet<GovernanceSnapshot>('/api/governance'), apiGet<CircleMember[]>('/api/members'),
    ]);
  }
  return { key, snapshot, artifact, governance, members, error: null };
}

export function useCircle(): CircleClientState {
  const session = useTideSession();
  const [data, setData] = useState<LoadedCircle | null>(null);
  const [selectedRecordId, setSelectedRecordId] = useState('payout-c3');
  const [refreshingKey, setRefreshingKey] = useState<string | null>(null);
  const generation = useRef(0);
  const key = session.authenticated ? `${session.username}:${session.isSteward}:${selectedRecordId}` : '';

  const refresh = useCallback(async () => {
    if (!key) return;
    const requestId = ++generation.current;
    setRefreshingKey(key);
    try {
      const result = await loadCircle(key, selectedRecordId, session.isSteward);
      if (requestId === generation.current) setData(result);
    } catch (cause) {
      if (requestId === generation.current) setData({ key, snapshot: null, artifact: null, governance: null, members: [], error: cause instanceof Error ? cause.message : 'The circle could not be loaded' });
    } finally {
      if (requestId === generation.current) setRefreshingKey(null);
    }
  }, [key, selectedRecordId, session.isSteward]);

  useEffect(() => {
    const requestId = ++generation.current;
    let active = true;
    if (key) {
      void loadCircle(key, selectedRecordId, session.isSteward).then(
        result => { if (active && requestId === generation.current) setData(result); },
        cause => {
          if (active && requestId === generation.current) setData({ key, snapshot: null, artifact: null, governance: null, members: [], error: cause instanceof Error ? cause.message : 'The circle could not be loaded' });
        },
      );
    }
    return () => { active = false; };
  }, [key, selectedRecordId, session.isSteward]);

  const selectRecord = useCallback((recordId: string) => {
    if (/^payout-c(?:1|3|4)$/.test(recordId)) setSelectedRecordId(recordId);
  }, []);
  // An old identity/record response is never exposed while new credentials or cycle data load.
  const current = key && data?.key === key ? data : null;
  return {
    snapshot: current?.snapshot ?? null,
    artifact: current?.artifact ?? null,
    governance: current?.governance ?? null,
    members: current?.members ?? [],
    loading: Boolean(key) && (!current || refreshingKey === key),
    error: current?.error ?? null,
    selectedRecordId,
    selectRecord,
    refresh,
  };
}
