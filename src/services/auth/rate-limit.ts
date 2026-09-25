/**
 * Sliding-window rate limiter (in memory, per server instance).
 * Swap the store for Redis/Upstash when running several instances — see DECISIONS.
 */

export type RateLimitResult = { allowed: boolean; remaining: number; retryAfterMs: number };

export class SlidingWindowLimiter {
  private readonly hits = new Map<string, number[]>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  check(key: string): RateLimitResult {
    const now = this.now();
    const windowStart = now - this.windowMs;
    const recent = (this.hits.get(key) ?? []).filter((t) => t > windowStart);

    if (recent.length >= this.limit) {
      this.hits.set(key, recent);
      return { allowed: false, remaining: 0, retryAfterMs: recent[0]! + this.windowMs - now };
    }
    recent.push(now);
    this.hits.set(key, recent);
    if (this.hits.size > 10_000) this.prune(windowStart);
    return { allowed: true, remaining: this.limit - recent.length, retryAfterMs: 0 };
  }

  reset(key: string) {
    this.hits.delete(key);
  }

  private prune(windowStart: number) {
    for (const [key, times] of this.hits) {
      if (!times.some((t) => t > windowStart)) this.hits.delete(key);
    }
  }
}

const MINUTE = 60_000;

/** Named limiters shared across requests of this process. */
export const limiters = {
  loginByIp: new SlidingWindowLimiter(20, 15 * MINUTE),
  loginByEmail: new SlidingWindowLimiter(5, 15 * MINUTE),
  registerByIp: new SlidingWindowLimiter(5, 60 * MINUTE),
  resetByIp: new SlidingWindowLimiter(5, 60 * MINUTE),
  resetByEmail: new SlidingWindowLimiter(3, 60 * MINUTE),
  verificationResend: new SlidingWindowLimiter(3, 60 * MINUTE),
  contactByIp: new SlidingWindowLimiter(5, 60 * MINUTE),
  /** Discount codes: slows down guessing. Keyed by user id or IP. */
  couponAttempts: new SlidingWindowLimiter(10, 15 * MINUTE),
  checkoutByUser: new SlidingWindowLimiter(10, 10 * MINUTE),
  newsletterByIp: new SlidingWindowLimiter(5, 60 * MINUTE),
};

export function retryAfterText(ms: number): string {
  const minutes = Math.max(1, Math.ceil(ms / MINUTE));
  return minutes === 1 ? "un minut" : `${minutes} minute`;
}
