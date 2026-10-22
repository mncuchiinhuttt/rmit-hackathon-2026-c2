import { ApiError, errorResponse, secureResponse } from "@/lib/server/api-errors";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { hasClientRole, hasRealmRole, resolveAuthContext, type AuthContext } from "@/features/auth/server/identity";
import { verifyDpop } from "@/features/auth/server/verify-dpop";
import { verifyTideJWT } from "@/features/auth/server/verify-tide-jwt";

export type AuthenticatedHandler = (request: Request, auth: AuthContext) => Response | Promise<Response>;

function assertSameOrigin(request: Request): void {
  const target = new URL(request.url);
  const origin = request.headers.get("origin");
  const site = request.headers.get("sec-fetch-site")?.toLowerCase();
  if (site !== undefined && site !== "same-origin" && site !== "none") {
    throw new ApiError(403, "same_origin_required", "This API accepts same-origin requests only.");
  }
  if (origin !== null) {
    let parsed: URL;
    try {
      parsed = new URL(origin);
    } catch {
      throw new ApiError(403, "same_origin_required", "This API accepts same-origin requests only.");
    }
    if (origin === "null" || parsed.origin !== target.origin) {
      throw new ApiError(403, "same_origin_required", "This API accepts same-origin requests only.");
    }
  }
  if (request.method !== "GET" && request.method !== "HEAD" && (!origin || new URL(origin).origin !== target.origin)) {
    throw new ApiError(403, "same_origin_required", "This API accepts same-origin requests only.");
  }
}

function readDpopToken(request: Request): string {
  const authorization = request.headers.get("authorization") ?? "";
  const match = /^DPoP ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/i.exec(authorization);
  const proof = request.headers.get("dpop");
  if (!match || !proof || proof.length > 8192) {
    throw new ApiError(401, "unauthorized", "Authentication failed.");
  }
  return match[1];
}

export function withAuth(handler: AuthenticatedHandler): (request: Request) => Promise<Response> {
  return async (request) => {
    try {
      assertSameOrigin(request);
      const accessToken = readDpopToken(request);
      const claims = await verifyTideJWT(accessToken);
      try {
        await verifyDpop(request, accessToken, claims as { cnf?: { jkt?: string } }, {
          trustForwardedHeaders: false,
        });
      } catch {
        throw new ApiError(401, "unauthorized", "Authentication failed.");
      }
      if (typeof claims.sub !== "string" || claims.sub.length === 0) {
        throw new ApiError(401, "unauthorized", "Authentication failed.");
      }
      enforceRateLimit(claims.sub, `${request.method}:${new URL(request.url).pathname}`, request.method === "GET" ? 60 : 12);
      const auth = resolveAuthContext(accessToken, claims);
      return secureResponse(await handler(request, auth));
    } catch (error) {
      return errorResponse(error);
    }
  };
}

export function withRealmRoles(roles: readonly string[], handler: AuthenticatedHandler): (request: Request) => Promise<Response> {
  return withAuth((request, auth) => {
    if (!roles.every((role) => hasRealmRole(auth.claims, role))) {
      throw new ApiError(403, "forbidden", "This action is not permitted.");
    }
    return handler(request, auth);
  });
}

export function withRealmRole(role: string, handler: AuthenticatedHandler): (request: Request) => Promise<Response> {
  return withRealmRoles([role], handler);
}

export function withClientRole(
  clientId: string,
  role: string,
  handler: AuthenticatedHandler,
): (request: Request) => Promise<Response> {
  return withAuth((request, auth) => {
    if (!hasClientRole(auth.claims, clientId, role)) throw new ApiError(403, "forbidden", "This action is not permitted.");
    return handler(request, auth);
  });
}
