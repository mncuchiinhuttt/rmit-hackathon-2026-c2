import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { Buffer } from "node:buffer";
import { ApiError, jsonResponse } from "@/lib/server/api-errors";
import { requireJsonObject, readJsonBody } from "@/lib/server/request-body";
import type { AuthContext } from "@/features/auth/server/identity";
import { getMappedDemoUser } from "@/features/auth/server/demo-users";
import { CYCLE_NUMBERS, cycleMetadata } from "@/features/circle/model";
import type { AuditEvent } from "@/features/circle/types";
import { appendLedgerEvent, updateLedger } from "@/features/releases/server/persistence";
import { parseRecordId } from "@/features/releases/server/record-id";

function redemptionEvent(auth: AuthContext, recordId: string): AuditEvent {
  return {
    id: randomUUID(),
    at: new Date().toISOString(),
    actor: auth.session.username,
    action: "synthetic_escrow_redeemed",
    recordId,
  };
}

export async function redeemEscrow(request: Request, auth: AuthContext): Promise<Response> {
  const body = requireJsonObject(await readJsonBody(request));
  if (Object.keys(body).length !== 2 || !Object.keys(body).every((key) => ["recordId", "code"].includes(key))) {
    throw new ApiError(400, "invalid_request", "The redemption request is invalid.");
  }
  const recordId = parseRecordId(body.recordId);
  if (typeof body.code !== "string" || !/^[a-f0-9]{48}$/.test(body.code)) {
    throw new ApiError(400, "invalid_code", "The redemption code is invalid.");
  }

  const metadata = CYCLE_NUMBERS.map(cycleMetadata).find((cycle) => cycle.recordId === recordId);
  if (!metadata) throw new ApiError(400, "invalid_record_id", "Choose a seeded payout record.");
  const beneficiary = getMappedDemoUser(metadata.beneficiaryUsername);
  if (auth.session.sub !== beneficiary.id) {
    throw new ApiError(403, "forbidden", "Only the expected beneficiary may redeem this release.");
  }
  if (!auth.session.realmRoles.includes("_tide_decryptor") || !auth.session.realmRoles.includes(metadata.releaseRole)) {
    throw new ApiError(403, "release_roles_required", "The beneficiary's Tide release roles are required.");
  }

  const codeHash = createHash("sha256").update(body.code, "utf8").digest();
  await updateLedger((ledger) => {
    const release = ledger.releases[recordId];
    if (!release) throw new ApiError(404, "release_not_found", "This payout record has no sealed release.");
    if (release.beneficiarySub !== beneficiary.id) {
      throw new ApiError(503, "release_identity_mismatch", "The stored release beneficiary mapping is inconsistent.");
    }
    if (release.redeemedAt !== null) throw new ApiError(409, "already_redeemed", "This synthetic escrow release has already been redeemed.");
    const expectedHash = Buffer.from(release.codeHash, "hex");
    if (expectedHash.length !== codeHash.length || !timingSafeEqual(expectedHash, codeHash)) {
      throw new ApiError(403, "invalid_code", "The redemption code was not accepted.");
    }
    const updatedRelease = { ...release, redeemedAt: new Date().toISOString() };
    const next = {
      ...ledger,
      releases: { ...ledger.releases, [recordId]: updatedRelease },
      events: appendLedgerEvent(ledger, redemptionEvent(auth, recordId)),
    };
    return { next, result: undefined };
  });

  return jsonResponse({ recordId, redeemed: true, paid: true, synthetic: true });
}
