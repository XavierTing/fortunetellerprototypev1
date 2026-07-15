/**
 * In-memory, per-process token-bucket rate limiter (PRD §11: "rate-limit
 * chat" under Cost control; this review's item 1 extends that to every
 * LLM-calling path ahead of a real `DEEPSEEK_API_KEY` going live).
 *
 * PROTOTYPE SCOPE — deliberately NOT production-grade:
 *   - State lives in a plain module-level `Map`, so it resets to empty on
 *     every process restart/redeploy (a burst right after a deploy is
 *     under-limited for one window).
 *   - It is NOT shared across multiple instances/replicas — each server
 *     process enforces its own independent limits. Fine for this
 *     single-instance prototype; a real multi-instance deployment needs a
 *     shared store (Redis `INCR`+`EXPIRE`, Upstash's rate-limit primitive,
 *     etc.) — see README's Known Limitations.
 *   - No persistence, no distributed clock skew handling, no admin
 *     reset/allowlist endpoint.
 *
 * Design: a classic continuous-refill token bucket per key, so bursts are
 * allowed up to `max` and then smoothly throttled, rather than a hard reset
 * at a fixed-window boundary (which lets a caller do `max` requests at
 * 0:59 and another `max` at 1:00). `checkRateLimit` both checks AND
 * consumes a token in one call — callers should treat a `false` result as
 * "reject this request," not merely "warn."
 */

export interface RateLimitConfig {
  /** Max requests allowed per full `windowMs` at a steady state (bucket capacity). */
  max: number;
  /** Window size in ms the bucket refills across. */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  /** Tokens left in the bucket after this check (0 when blocked). */
  remaining: number;
  /** ms until at least one token is available again — only set when blocked. */
  retryAfterMs?: number;
}

interface Bucket {
  tokens: number;
  updatedAt: number;
}

const buckets = new Map<string, Bucket>();

/**
 * Opportunistic cleanup so a long-running process doesn't accumulate one
 * bucket per distinct (bucketName, session/IP) forever. Cheap and rare —
 * only runs once the map has grown past a generous ceiling, and only drops
 * buckets that have been idle long enough to be fully refilled anyway.
 */
const MAX_TRACKED_BUCKETS = 50_000;
const IDLE_SWEEP_MS = 60 * 60 * 1000; // 1 hour

function sweepIfNeeded(now: number) {
  if (buckets.size <= MAX_TRACKED_BUCKETS) return;
  for (const [key, bucket] of buckets) {
    if (now - bucket.updatedAt > IDLE_SWEEP_MS) buckets.delete(key);
  }
}

/**
 * Checks and consumes one token from `key`'s bucket under `config`. Call
 * once per attempt, immediately before doing the expensive (LLM-calling)
 * work — a `{ allowed: false }` result means the caller should reject the
 * request (HTTP 429 / a friendly inline error) without doing that work.
 */
export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const refillRate = config.max / config.windowMs; // tokens per ms

  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { tokens: config.max, updatedAt: now };
    buckets.set(key, bucket);
    sweepIfNeeded(now);
  } else {
    const elapsed = Math.max(0, now - bucket.updatedAt);
    bucket.tokens = Math.min(config.max, bucket.tokens + elapsed * refillRate);
    bucket.updatedAt = now;
  }

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return { allowed: true, remaining: Math.floor(bucket.tokens) };
  }

  const deficit = 1 - bucket.tokens;
  const retryAfterMs = Math.max(1, Math.ceil(deficit / refillRate));
  return { allowed: false, remaining: 0, retryAfterMs };
}

/**
 * Named presets for this app's LLM-calling surfaces — generous enough not
 * to bother a real user working the app normally, bounded enough to cap
 * worst-case spend from a single abusive session/IP. Tune freely; nothing
 * else depends on the exact numbers.
 */
export const RATE_LIMITS = {
  /** 师傅 chat turns — one LLM call per message, no caching. */
  chat: { max: 20, windowMs: 5 * 60 * 1000 }, // ~20 / 5 min
  /** Natal reading generation (not cache replays — see reading stream route). */
  reading: { max: 10, windowMs: 60 * 60 * 1000 }, // ~10 / hr
  /** Daily fortune generation (not cache replays). */
  daily: { max: 30, windowMs: 60 * 60 * 1000 }, // ~30 / hr
  /** Compatibility reading generation. */
  compat: { max: 10, windowMs: 60 * 60 * 1000 }, // ~10 / hr
} as const satisfies Record<string, RateLimitConfig>;

export type RateLimitBucketName = keyof typeof RATE_LIMITS;

/**
 * Applies both a per-session AND a per-IP bucket for `bucketName`:
 *   - per-session stops one anon-cookie session from burning the budget on
 *     its own, even if the underlying IP is shared (office/NAT/VPN egress).
 *   - per-IP (given a generous multiple of the session cap) stops someone
 *     from resetting their limit by simply clearing cookies / opening an
 *     incognito window, since a fresh session still shares the same IP.
 * Blocked if EITHER dimension is exhausted. Both buckets are checked (and
 * consumed) on every call for simplicity — in the rare case the session
 * bucket had room but the IP bucket was already exhausted, the session
 * bucket still loses a token it arguably "shouldn't have"; acceptable
 * imprecision for a prototype-scoped limiter, not a correctness bug (it
 * only makes the effective limit very slightly stricter under contention).
 */
export function checkDualRateLimit(
  bucketName: RateLimitBucketName,
  sessionKey: string,
  ipKey: string
): RateLimitResult {
  const config = RATE_LIMITS[bucketName];
  const ipConfig: RateLimitConfig = { max: config.max * 3, windowMs: config.windowMs };

  const bySession = checkRateLimit(`${bucketName}:session:${sessionKey}`, config);
  const byIp = checkRateLimit(`${bucketName}:ip:${ipKey}`, ipConfig);

  if (bySession.allowed && byIp.allowed) {
    return { allowed: true, remaining: Math.min(bySession.remaining, byIp.remaining) };
  }
  return {
    allowed: false,
    remaining: 0,
    retryAfterMs: Math.max(bySession.retryAfterMs ?? 0, byIp.retryAfterMs ?? 0),
  };
}

/** Extracts a best-effort client IP from a Route Handler's `Request` (or `next/headers`' `headers()`). Falls back to a constant so a missing header degrades to "everyone shares one IP bucket" rather than throwing. */
export function getClientIp(headersLike: Headers): string {
  const forwardedFor = headersLike.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = headersLike.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

/** A friendly, on-brand 429 message — never a bare "Too Many Requests." */
export function rateLimitMessage(bucketName: RateLimitBucketName): string {
  switch (bucketName) {
    case "chat":
      return "You're asking the 师傅 a lot of questions at once — give it a minute and try again.";
    case "reading":
      return "You've generated a few readings in a row — give it a little while before casting another.";
    case "daily":
      return "Today's fortune is refreshing a lot right now — please try again shortly.";
    case "compat":
      return "You've checked a few compatibility readings in a row — give it a little while and try again.";
    default:
      return "You're doing that a bit too fast — please wait a moment and try again.";
  }
}

/** Builds a standard, friendly 429 Response (JSON body + `Retry-After` header) for Route Handlers. */
export function rateLimitedResponse(bucketName: RateLimitBucketName, result: RateLimitResult): Response {
  const retryAfterSeconds = Math.max(1, Math.ceil((result.retryAfterMs ?? 60_000) / 1000));
  return new Response(JSON.stringify({ message: rateLimitMessage(bucketName), retryAfterSeconds }), {
    status: 429,
    headers: {
      "Content-Type": "application/json",
      "Retry-After": String(retryAfterSeconds),
    },
  });
}

/**
 * Thrown by call sites that can't return an HTTP Response directly (e.g. a
 * Server Component's data loader, like `today/lib.ts`'s `loadDailyFortune`)
 * when a generation attempt is rate-limited. The caller is expected to
 * catch this specifically and render a friendly inline state rather than
 * letting it surface as an unhandled 500.
 */
export class RateLimitExceededError extends Error {
  readonly bucketName: RateLimitBucketName;
  readonly retryAfterMs: number;

  constructor(bucketName: RateLimitBucketName, retryAfterMs: number) {
    super(rateLimitMessage(bucketName));
    this.name = "RateLimitExceededError";
    this.bucketName = bucketName;
    this.retryAfterMs = retryAfterMs;
  }
}

/** Test-only escape hatch: clears all in-memory buckets between test cases. */
export function __resetRateLimitsForTests(): void {
  buckets.clear();
}
