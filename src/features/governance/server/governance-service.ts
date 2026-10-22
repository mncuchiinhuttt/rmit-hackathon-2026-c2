import { Buffer } from "node:buffer";
import { ApiError, jsonResponse } from "@/lib/server/api-errors";
import { isRecord } from "@/lib/server/guards";
import { readJsonStream } from "@/lib/server/request-body";
import type { AuthContext } from "@/features/auth/server/identity";
import { parseChangeRequests } from "@/features/governance/server/change-request-view";
import type { GovernanceSnapshot } from "@/features/governance/types";
import { loadTideConfig } from "@/features/auth/server/tide-config";

function requireSteward(auth: AuthContext): void {
  if (!auth.session.isSteward) throw new ApiError(403, "forbidden", "This action is not permitted.");
}

function upstreamError(status?: number): ApiError {
  if (status === 401) return new ApiError(401, "tide_unauthorized", "Tide rejected the caller token.");
  if (status === 403) return new ApiError(403, "tide_forbidden", "Tide denied this read.");
  return new ApiError(502, "tide_read_failed", "Tide governance data could not be read.");
}

async function readTideJson(url: string, accessToken: string): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw upstreamError();
  }
  if (!response.ok) throw upstreamError(response.status);
  try {
    return await readJsonStream(response.body, response.headers, 1024 * 1024);
  } catch {
    throw upstreamError();
  }
}

function parseAdminPolicy(value: unknown): string {
  if (!isRecord(value) || typeof value.policy !== "string" || value.policy.length === 0 || value.policy.length > 65_536) {
    throw upstreamError();
  }
  const policyBytes = Buffer.from(value.policy, "base64");
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value.policy) || policyBytes.toString("base64") !== value.policy) {
    throw upstreamError();
  }
  return value.policy;
}


export async function getAdminPolicy(auth: AuthContext): Promise<Response> {
  requireSteward(auth);
  const config = loadTideConfig();
  const url = `${config["auth-server-url"]}/admin/realms/${encodeURIComponent(config.realm)}/iga/role-policies/name/tide-realm-admin`;
  const policyB64 = parseAdminPolicy(await readTideJson(url, auth.accessToken));
  return jsonResponse({ policyB64 });
}

export async function getGovernance(auth: AuthContext): Promise<Response> {
  requireSteward(auth);
  const config = loadTideConfig();
  const base = `${config["auth-server-url"]}/admin/realms/${encodeURIComponent(config.realm)}`;
  const [pending, approved, roles] = await Promise.all([
    readTideJson(`${base}/iga/change-requests?status=PENDING`, auth.accessToken),
    readTideJson(`${base}/iga/change-requests?status=APPROVED`, auth.accessToken),
    readTideJson(`${base}/roles`, auth.accessToken),
  ]);
  if (!Array.isArray(pending) || !Array.isArray(approved)) throw upstreamError();
  const snapshot: GovernanceSnapshot = {
    requests: parseChangeRequests([...pending, ...approved], roles),
    verifiedAt: new Date().toISOString(),
  };
  return jsonResponse(snapshot);
}
