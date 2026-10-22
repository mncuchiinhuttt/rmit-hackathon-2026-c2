import { createLocalJWKSet, jwtVerify, type JWSAlgorithm, type JWTVerifyOptions, type JWTPayload, type LocalJWKSet } from "jose";
import { ApiError } from "@/lib/server/api-errors";
import { loadTideConfig } from "@/features/auth/server/tide-config";

const ALLOWED_ALGORITHMS: JWSAlgorithm[] = ["EdDSA"];
const REQUIRED_CLAIMS: NonNullable<JWTVerifyOptions["requiredClaims"]> = ["sub", "exp", "iat", "iss", "azp"];
let localJwks: LocalJWKSet | null = null;

function jwks(): LocalJWKSet {
  if (localJwks) return localJwks;
  try {
    localJwks = createLocalJWKSet(loadTideConfig().jwk);
    return localJwks;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(503, "tide_config_unavailable", "Tide adapter configuration is unavailable.");
  }
}

export async function verifyTideJWT(token: string): Promise<JWTPayload> {
  const config = loadTideConfig();
  if (token.length === 0 || token.length > 8192) {
    throw new ApiError(401, "unauthorized", "Authentication failed.");
  }
  const issuer = `${config["auth-server-url"]}/realms/${config.realm}`;
  const keySet = jwks();
  try {
    const { payload } = await jwtVerify(token, keySet, {
      issuer,
      algorithms: ALLOWED_ALGORITHMS,
      requiredClaims: REQUIRED_CLAIMS,
      clockTolerance: 0,
    });
    const now = Math.floor(Date.now() / 1000);
    if (payload.iss !== issuer || payload.azp !== config.resource || typeof payload.sub !== "string" || payload.sub.length === 0 || payload.sub.length > 256) {
      throw new ApiError(401, "unauthorized", "Authentication failed.");
    }
    if (typeof payload.exp !== "number" || !Number.isSafeInteger(payload.exp) || typeof payload.iat !== "number" || !Number.isSafeInteger(payload.iat)) {
      throw new ApiError(401, "unauthorized", "Authentication failed.");
    }
    if (payload.exp <= now || payload.exp <= payload.iat || payload.iat > now + 60) {
      throw new ApiError(401, "unauthorized", "Authentication failed.");
    }
    return payload;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(401, "unauthorized", "Authentication failed.");
  }
}
