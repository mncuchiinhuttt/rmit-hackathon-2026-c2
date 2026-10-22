import type { NextRequest } from "next/server";
import { errorResponse, jsonResponse } from "@/lib/server/api-errors";
import { readJsonBody } from "@/lib/server/request-body";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { EMPTY_SIMULATION } from "@/features/demo/simulation-contract";
import { simulationDatabase } from "@/features/demo/server/sqlite-database";
import { applySimulationCommand, simulationView } from "@/features/demo/server/simulation-service";
import { assertSimulationRequest, parseSimulationCommand, requestSessionToken } from "@/features/demo/server/simulation-request";
import { createSession, deleteSession, sessionActor, sessionCookie } from "@/features/demo/server/simulation-sessions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET(request: NextRequest): Response {
  try {
    assertSimulationRequest(request);
    const database = simulationDatabase();
    return jsonResponse(simulationView(database, sessionActor(database, requestSessionToken(request))));
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    assertSimulationRequest(request);
    enforceRateLimit("simulation-local", "commands", 120);
    const command = parseSimulationCommand(await readJsonBody(request));
    const database = simulationDatabase();
    const oldToken = requestSessionToken(request);
    const secure = new URL(request.url).protocol === "https:";
    if (command.type === "sign-in") {
      const token = createSession(database, command.actor, oldToken);
      const response = jsonResponse(simulationView(database, command.actor));
      response.headers.set("Set-Cookie", sessionCookie(token, secure));
      return response;
    }
    if (command.type === "sign-out") {
      deleteSession(database, oldToken);
      const response = jsonResponse(EMPTY_SIMULATION);
      response.headers.set("Set-Cookie", sessionCookie("", secure));
      return response;
    }
    const view = applySimulationCommand(database, sessionActor(database, oldToken), command);
    return jsonResponse(view, view.state?.error ? 403 : 200);
  } catch (error) { return errorResponse(error); }
}
