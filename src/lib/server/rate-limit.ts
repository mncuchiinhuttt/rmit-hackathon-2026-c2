import { ApiError } from "@/lib/server/api-errors";

interface Bucket {
  start: number;
  count: number;
}
interface LimiterState {
  buckets: Map<string, Bucket>;
  requests: number;
}

declare global {
  var __huiRateLimiter: LimiterState | undefined;
}

const WINDOW_MS = 60_000;
const MAX_BUCKETS = 10_000;

function state(): LimiterState {
  return (globalThis.__huiRateLimiter ??= { buckets: new Map(), requests: 0 });
}

export function enforceRateLimit(
  subject: string,
  route: string,
  limit: number,
  now = Date.now(),
): void {
  const runtime = state();
  runtime.requests += 1;
  if (runtime.requests % 256 === 0 || runtime.buckets.size >= MAX_BUCKETS) {
    let earliestReset = Number.POSITIVE_INFINITY;
    for (const [key, bucket] of runtime.buckets) {
      const resetAt = bucket.start + WINDOW_MS;
      if (now >= resetAt) runtime.buckets.delete(key);
      else earliestReset = Math.min(earliestReset, resetAt);
    }
    if (runtime.buckets.size >= MAX_BUCKETS) {
      const retryAfter = Math.max(1, Math.ceil((earliestReset - now) / 1000));
      throw new ApiError(429, "rate_limited", "Too many requests. Try again shortly.", {
        "Retry-After": String(retryAfter),
      });
    }
  }

  const key = `${subject}\u0000${route}`;
  let bucket = runtime.buckets.get(key);
  if (!bucket || now >= bucket.start + WINDOW_MS) {
    bucket = { start: now, count: 0 };
    runtime.buckets.set(key, bucket);
  }
  if (bucket.count >= limit) {
    const retryAfter = Math.max(1, Math.ceil((bucket.start + WINDOW_MS - now) / 1000));
    throw new ApiError(429, "rate_limited", "Too many requests. Try again shortly.", {
      "Retry-After": String(retryAfter),
    });
  }
  bucket.count += 1;
}
