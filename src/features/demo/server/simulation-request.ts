import type { NextRequest } from "next/server";
import { ApiError } from "@/lib/server/api-errors";
import { requireJsonObject } from "@/lib/server/request-body";
import { resolveAuthMode } from "@/features/auth/mode";
import { isDemoRole, type SimulationCommand } from "../simulation-contract";

export function assertSimulationRequest(request: Request): void {
  if (resolveAuthMode(process.env.HUI_AUTH_MODE) !== "simulated") {
    throw new ApiError(404, "not_found", "This endpoint is not available.");
  }
  const url = new URL(request.url);
  if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
    throw new ApiError(403, "simulation_local_only", "Sample account access is restricted to localhost.");
  }
  const origin = request.headers.get("origin");
  const site = request.headers.get("sec-fetch-site");
  if ((site && site !== "same-origin" && site !== "none") ||
      (origin !== null && origin !== url.origin) || (request.method !== "GET" && origin !== url.origin)) {
    throw new ApiError(403, "same_origin_required", "Use this app's own origin for sample account requests.");
  }
}

export function parseSimulationCommand(value: unknown): SimulationCommand {
  const body = requireJsonObject(value);
  const allowed = body.type === "sign-in" ? ["type", "actor"] : body.type === "propose" ? ["type", "recordId", "kind", "target"] : body.type === "vote" ? ["type", "requestId"] : body.type === "redeem" ? ["type", "recordId", "code"] : ["type", "recordId"];
  if (Object.keys(body).some(key => !allowed.includes(key))) throw new ApiError(400, "invalid_request", "Unexpected sample command field.");
  if (body.type === "sign-in" && isDemoRole(body.actor)) return { type: body.type, actor: body.actor };
  if (body.type === "sign-out" || body.type === "reset") return { type: body.type };
  if (body.type === "vote" && typeof body.requestId === "string" && /^[a-f0-9-]{36}$/.test(body.requestId)) return { type: "vote", requestId: body.requestId };
  if (body.type === "propose" && typeof body.recordId === "string" && /^payout-c(1|3|4)$/.test(body.recordId) && (body.kind === "grant" || body.kind === "renew" || body.kind === "revoke")) {
    if (body.kind === "grant" && !isDemoRole(body.target)) throw new ApiError(400, "invalid_request", "Choose a sample reader.");
    if (body.kind !== "grant" && body.target !== null) throw new ApiError(400, "invalid_request", "Renewal and revocation preserve cycle scope.");
    return { type: "propose", recordId: body.recordId, kind: body.kind, target: isDemoRole(body.target) ? body.target : null };
  }
  if (["seal", "open", "redeem"].includes(String(body.type)) &&
      typeof body.recordId === "string" && /^payout-c(1|3|4)$/.test(body.recordId)) {
    if (body.type === "redeem") {
      if (typeof body.code !== "string" || body.code.length > 128) throw new ApiError(400, "invalid_request", "Send the sample redemption code.");
      return { type: "redeem", recordId: body.recordId, code: body.code };
    }
    if (body.type === "seal" || body.type === "open") return { type: body.type, recordId: body.recordId };
  }
  throw new ApiError(400, "invalid_request", "Unknown sample account or command.");
}

export function requestSessionToken(request: NextRequest): string | undefined {
  return request.cookies.get("hui_simulation")?.value;
}
