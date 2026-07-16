import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  __resetRateLimitsForTests,
  checkDualRateLimit,
  checkRateLimit,
  getClientIp,
  rateLimitedResponse,
  rateLimitMessage,
  RATE_LIMITS,
} from "./rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    __resetRateLimitsForTests();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-15T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows up to `max` requests, then blocks the next one", () => {
    const config = { max: 3, windowMs: 1000 };
    expect(checkRateLimit("k1", config).allowed).toBe(true);
    expect(checkRateLimit("k1", config).allowed).toBe(true);
    expect(checkRateLimit("k1", config).allowed).toBe(true);
    const blocked = checkRateLimit("k1", config);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });

  it("tracks distinct keys independently", () => {
    const config = { max: 1, windowMs: 1000 };
    expect(checkRateLimit("a", config).allowed).toBe(true);
    expect(checkRateLimit("b", config).allowed).toBe(true);
    expect(checkRateLimit("a", config).allowed).toBe(false);
    expect(checkRateLimit("b", config).allowed).toBe(false);
  });

  it("refills tokens continuously over the window", () => {
    const config = { max: 2, windowMs: 1000 };
    expect(checkRateLimit("refill", config).allowed).toBe(true);
    expect(checkRateLimit("refill", config).allowed).toBe(true);
    expect(checkRateLimit("refill", config).allowed).toBe(false);

    // Half the window elapses — one token's worth (max/2) should refill.
    vi.advanceTimersByTime(500);
    expect(checkRateLimit("refill", config).allowed).toBe(true);
    expect(checkRateLimit("refill", config).allowed).toBe(false);

    // The rest of the window elapses — back to full capacity.
    vi.advanceTimersByTime(1000);
    expect(checkRateLimit("refill", config).allowed).toBe(true);
  });

  it("never exceeds bucket capacity even after a long idle period", () => {
    const config = { max: 2, windowMs: 1000 };
    checkRateLimit("cap", config);
    vi.advanceTimersByTime(1_000_000);
    // Still only 2 tokens available, not an unbounded backlog.
    expect(checkRateLimit("cap", config).allowed).toBe(true);
    expect(checkRateLimit("cap", config).allowed).toBe(true);
    expect(checkRateLimit("cap", config).allowed).toBe(false);
  });
});

describe("checkDualRateLimit", () => {
  beforeEach(() => {
    __resetRateLimitsForTests();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-15T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests within both the session and IP budgets", () => {
    const result = checkDualRateLimit("chat", "session-1", "1.2.3.4");
    expect(result.allowed).toBe(true);
  });

  it("blocks once the per-session budget for that bucket is exhausted, even under a fresh IP bucket", () => {
    const max = RATE_LIMITS.chat.max;
    for (let i = 0; i < max; i++) {
      expect(checkDualRateLimit("chat", "session-exhaust", `1.2.3.${i}`).allowed).toBe(true);
    }
    const blocked = checkDualRateLimit("chat", "session-exhaust", "9.9.9.9");
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });

  it("blocks once the per-IP budget is exhausted, even across many distinct sessions", () => {
    const ipMax = RATE_LIMITS.chat.max * 3;
    for (let i = 0; i < ipMax; i++) {
      expect(checkDualRateLimit("chat", `session-${i}`, "shared-ip").allowed).toBe(true);
    }
    const blocked = checkDualRateLimit("chat", "session-new", "shared-ip");
    expect(blocked.allowed).toBe(false);
  });

  it("keeps different bucket names independent for the same session/IP", () => {
    for (let i = 0; i < RATE_LIMITS.reading.max; i++) {
      checkDualRateLimit("reading", "s", "ip");
    }
    expect(checkDualRateLimit("reading", "s", "ip").allowed).toBe(false);
    // A different bucket (chat) for the same session/IP is untouched.
    expect(checkDualRateLimit("chat", "s", "ip").allowed).toBe(true);
  });
});

describe("getClientIp", () => {
  it("reads the first entry of x-forwarded-for", () => {
    const headers = new Headers({ "x-forwarded-for": "203.0.113.5, 10.0.0.1" });
    expect(getClientIp(headers)).toBe("203.0.113.5");
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", () => {
    const headers = new Headers({ "x-real-ip": "198.51.100.7" });
    expect(getClientIp(headers)).toBe("198.51.100.7");
  });

  it("falls back to a constant when no IP header is present", () => {
    expect(getClientIp(new Headers())).toBe("unknown");
  });
});

describe("rateLimitMessage", () => {
  it("returns a distinct, friendly (non-generic) message per bucket", () => {
    const messages = new Set(
      (Object.keys(RATE_LIMITS) as (keyof typeof RATE_LIMITS)[]).map((bucket) => rateLimitMessage(bucket))
    );
    expect(messages.size).toBe(Object.keys(RATE_LIMITS).length);
    for (const message of messages) {
      expect(message.toLowerCase()).not.toBe("too many requests");
      expect(message.length).toBeGreaterThan(10);
    }
  });
});

describe("rateLimitedResponse", () => {
  it("returns a 429 with a Retry-After header and a friendly JSON body", async () => {
    const res = rateLimitedResponse("chat", { allowed: false, remaining: 0, retryAfterMs: 4200 });
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("5");
    const body = (await res.json()) as { message: string; retryAfterSeconds: number };
    expect(body.message).toContain("Master");
    expect(body.retryAfterSeconds).toBe(5);
  });
});
