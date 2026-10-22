export class DpopError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DpopError";
  }
}

/** Replace with Redis/Postgres for multi-instance deployments — see "Replay" below. */
export interface JtiStore {
  /** true if this jti has NOT been seen before (and records it). */
  claim(jti: string, expiresAtMs: number): Promise<boolean>;
}

export const IAT_SKEW_SECONDS = 300;

/**
 * In-memory default. Correct for a single process ONLY.
 *
 * A serverless deployment runs many isolated instances, so a per-instance Set does not prevent
 * replay — it merely makes it less likely, which is worse than not claiming the protection at all.
 * Ship a shared store before relying on the replay check (AP-44 covers the same trap for rate
 * limits and sessions).
 */
export class MemoryJtiStore implements JtiStore {
  private seen = new Map<string, number>();
  async claim(jti: string, expiresAtMs: number): Promise<boolean> {
    const now = Date.now();
    for (const [k, exp] of this.seen) if (exp < now) this.seen.delete(k);
    if (this.seen.has(jti)) return false;
    this.seen.set(jti, expiresAtMs);
    return true;
  }
}

/**
 * The absolute URL the CLIENT saw, which is what it signed into `htu`.
 *
 * Behind a proxy or tunnel (cloudflared, a load balancer, Vercel), `req.nextUrl.origin` is the
 * INTERNAL origin — `https://localhost:3000` — not the host the browser used. Comparing that to
 * `htu` rejects every legitimate request, so the app 401s entirely the moment it goes behind a
 * reverse proxy. Measured: `x-forwarded-host` + `x-forwarded-proto` reconstruct the true origin in
 * both the tunnelled and the direct-localhost case (LEARNINGS-nightfabric-001 L-02).
 *
 * ⚠️ Only trust these headers when a proxy you control sets them. Directly exposed to the internet,
 * a client can forge `x-forwarded-host` and choose its own `htu` — pass `trustForwardedHeaders:
 * false` in that case.
 */
export function requestHtu(
  req: { url: string; headers: { get(name: string): string | null } },
  trustForwardedHeaders = true,
): string {
  const url = new URL(req.url);
  if (trustForwardedHeaders) {
    const host = req.headers.get("x-forwarded-host");
    const proto = req.headers.get("x-forwarded-proto");
    if (host) {
      // `x-forwarded-*` may be a comma-separated chain; the first entry is the original client-facing value.
      const h = host.split(",")[0].trim();
      const p = (proto?.split(",")[0].trim()) || url.protocol.replace(":", "");
      return `${p}://${h}${url.pathname}`;
    }
  }
  // The SDK signs `origin + pathname` — no query string. Matching on the full URL fails every
  // request that carries one.
  return `${url.origin}${url.pathname}`;
}

export interface VerifyDpopOptions {
  jtiStore?: JtiStore;
  trustForwardedHeaders?: boolean;
  /** Accept a wider iat window. Default 300s. */
  iatSkewSeconds?: number;
}

export const defaultStore = new MemoryJtiStore();

export async function sha256(s: string): Promise<ArrayBuffer> {
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
}

export function base64url(buf: ArrayBuffer): string {
  let bin = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
