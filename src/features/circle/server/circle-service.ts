import { jsonResponse } from "@/lib/server/api-errors";
import type { AuthContext } from "@/features/auth/server/identity";
import { listMappedDemoUsers } from "@/features/auth/server/demo-users";
import { CIRCLE_NAME, CONTRIBUTION_VND, CYCLE_NUMBERS, MEMBER_COUNT, cycleMetadata } from "@/features/circle/model";
import type { AuditEvent, CircleSnapshot, CycleSummary } from "@/features/circle/types";
import type { CircleMember } from "@/features/auth/types";
import { readLedger } from "@/features/releases/server/persistence";

export async function getCircle(auth: AuthContext): Promise<Response> {
  const ledger = await readLedger();
  const cycles: CycleSummary[] = CYCLE_NUMBERS.map((number) => {
    const metadata = cycleMetadata(number);
    const release = ledger.releases[metadata.recordId];
    return {
      ...metadata,
      sealed: release !== undefined,
      redeemed: release !== undefined && release.redeemedAt !== null,
      ciphertextBytes: release ? new TextEncoder().encode(release.ciphertext).byteLength : 0,
      sealedAt: release?.createdAt ?? null,
    };
  });
  const events: AuditEvent[] = ledger.events.slice(-12).reverse();
  const snapshot: CircleSnapshot = {
    name: CIRCLE_NAME,
    memberCount: MEMBER_COUNT,
    contributionVnd: CONTRIBUTION_VND,
    synthetic: true,
    cycles,
    session: auth.session,
    events,
  };
  return jsonResponse(snapshot);
}

export function getMembers(): Response {
  const members: CircleMember[] = listMappedDemoUsers().map((user) => ({
    sub: user.id,
    username: user.username,
    tideUserKey: user.tideUserKey,
  }));
  return jsonResponse(members);
}
