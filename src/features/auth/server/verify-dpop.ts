import { jwtVerify, importJWK, calculateJwkThumbprint, decodeProtectedHeader, type JWK } from "jose";
import { base64url, defaultStore, DpopError, IAT_SKEW_SECONDS, requestHtu, sha256, type VerifyDpopOptions } from "@/features/auth/server/dpop-primitives";

/**
 * Verify the DPoP proof on a request. Throws `DpopError` if the binding does not hold.
 *
 * @param req         the incoming request (Next.js `NextRequest` or any Fetch `Request`)
 * @param accessToken the raw access token string, as presented
 * @param claims      the VERIFIED access-token claims (must already have passed signature checks)
 */
export async function verifyDpop(
  req: { url: string; method: string; headers: { get(name: string): string | null } },
  accessToken: string,
  claims: { cnf?: { jkt?: string } },
  opts: VerifyDpopOptions = {},
): Promise<void> {
  const jkt = claims.cnf?.jkt;

  // A token WITHOUT cnf.jkt is not sender-constrained. Do not silently accept it here: if your realm
  // issues bound tokens, an unbound one is either a downgrade attempt or a misconfigured client.
  if (!jkt) {
    throw new DpopError(
      "Access token has no cnf.jkt — it is not sender-constrained. Enable useDPoP on the client; " +
        "accepting it here would make DPoP optional, which is the same as not having it.",
    );
  }

  // The scheme matters. This is the exact replay that succeeded when only the signature was checked:
  // a bound token presented as `Bearer` must be rejected, or the binding buys nothing.
  const authz = req.headers.get("authorization") ?? "";
  if (!/^DPoP /i.test(authz)) {
    throw new DpopError(
      "Sender-constrained token presented without the DPoP auth scheme. A cnf.jkt token sent as " +
        "`Bearer` is a replay of a stolen token.",
    );
  }

  const proof = req.headers.get("dpop");
  if (!proof) throw new DpopError("Missing DPoP proof header.");

  let header: ReturnType<typeof decodeProtectedHeader>;
  try {
    header = decodeProtectedHeader(proof);
  } catch {
    throw new DpopError("DPoP proof is not a compact JWS.");
  }
  if (header.typ !== "dpop+jwt") throw new DpopError(`DPoP proof typ is '${header.typ}', expected 'dpop+jwt'.`);
  const jwk = header.jwk as JWK | undefined;
  if (!jwk) throw new DpopError("DPoP proof header has no embedded jwk.");

  // Verify with the key the proof carries — NOT the realm key. This is the step the older,
  // withdrawn guidance got wrong, and the reason it concluded the format was non-standard.
  let payload: Record<string, unknown>;
  try {
    const key = await importJWK(jwk, header.alg);
    ({ payload } = (await jwtVerify(proof, key)) as { payload: Record<string, unknown> });
  } catch (e) {
    throw new DpopError(`DPoP proof signature invalid: ${e instanceof Error ? e.message : String(e)}`);
  }

  // The binding itself: the proof's key must be the key the token was issued against.
  const thumb = await calculateJwkThumbprint(jwk, "sha256");
  if (thumb !== jkt) {
    throw new DpopError("DPoP proof key does not match the token's cnf.jkt — token and proof come from different keys.");
  }

  // ath ties the proof to THIS access token, so a proof captured from one request cannot be
  // replayed with a different stolen token.
  const expectedAth = base64url(await sha256(accessToken));
  if (payload.ath !== expectedAth) {
    throw new DpopError("DPoP proof `ath` does not match the presented access token.");
  }

  if (typeof payload.htm !== "string" || payload.htm.toUpperCase() !== req.method.toUpperCase()) {
    throw new DpopError(`DPoP proof htm '${String(payload.htm)}' does not match ${req.method}.`);
  }

  const htu = requestHtu(req, opts.trustForwardedHeaders ?? true);
  if (payload.htu !== htu) {
    throw new DpopError(
      `DPoP proof htu '${String(payload.htu)}' does not match '${htu}'. Behind a proxy this is ` +
        "usually x-forwarded-host not being honoured, not an attack.",
    );
  }

  const skew = opts.iatSkewSeconds ?? IAT_SKEW_SECONDS;
  const iat = typeof payload.iat === "number" ? payload.iat : NaN;
  if (!Number.isFinite(iat) || Math.abs(Date.now() / 1000 - iat) > skew) {
    throw new DpopError(`DPoP proof iat is outside the ±${skew}s window.`);
  }

  const jti = payload.jti;
  if (typeof jti !== "string" || !jti) throw new DpopError("DPoP proof has no jti.");
  const store = opts.jtiStore ?? defaultStore;
  if (!(await store.claim(jti, (iat + skew) * 1000))) {
    throw new DpopError("DPoP proof jti already used — replay.");
  }
}
