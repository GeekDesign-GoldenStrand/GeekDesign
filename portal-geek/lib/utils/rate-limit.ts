/**
 * In-memory sliding-window rate limiter.
 *
 * Two usage styles:
 *
 *  - `checkRateLimit` — check **and** record in one call. Use when *every*
 *    attempt should count (e.g. credential guesses on auth/login, enumeration
 *    attempts on access-link).
 *
 *  - `peekRateLimit` + `recordAttempt` — check first, record only when the
 *    request did the work the limit is meant to bound. Use this for endpoints
 *    where a rejected request (validation 422) is cheap and shouldn't burn the
 *    caller's budget: a user fixing their form must not get locked out. Pair
 *    with `clearRateLimit` to reset a key after a legitimate success.
 *
 * NOTE: state lives in this process's memory. On a multi-instance deployment
 * (App Engine autoscaling) each instance has its own counters, so this is
 * best-effort across the fleet — see docs for the shared-store follow-up.
 */

interface Entry {
  /** Timestamps (ms) of each recorded attempt. */
  timestamps: number[];
  /** Window this key was last recorded with, so the pruner uses the right TTL. */
  windowMs: number;
}

const store = new Map<string, Entry>();

// Periodically purge stale keys so the Map doesn't grow forever.
const PRUNE_INTERVAL_MS = 60_000; // every 1 min
let pruneTimer: ReturnType<typeof setInterval> | null = null;

function ensurePruner() {
  if (pruneTimer) return;
  pruneTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      // Prune using each entry's OWN window — a global window would let a
      // short-window key (e.g. 1 min) evict a long-window one (e.g. 15 min)
      // while it is still active, silently weakening the longer limit.
      if (
        entry.timestamps.length === 0 ||
        entry.timestamps[entry.timestamps.length - 1] < now - entry.windowMs
      ) {
        store.delete(key);
      }
    }
  }, PRUNE_INTERVAL_MS);
  // Allow the Node process to exit even if the timer is active.
  if (pruneTimer && typeof pruneTimer === "object" && "unref" in pruneTimer) {
    pruneTimer.unref();
  }
}

export interface RateLimitConfig {
  /** Maximum number of attempts allowed inside the window. */
  maxAttempts: number;
  /** Window duration in milliseconds. */
  windowMs: number;
}

export interface RateLimitResult {
  /** Whether the request is allowed. */
  allowed: boolean;
  /** How many attempts remain before hitting the limit. */
  remaining: number;
  /** Milliseconds until the caller may retry (0 when allowed). */
  retryAfterMs: number;
}

/** Drop attempts that have fallen outside the sliding window, in place. */
function liveTimestamps(entry: Entry, now: number, windowMs: number): number[] {
  entry.timestamps = entry.timestamps.filter((t) => t > now - windowMs);
  return entry.timestamps;
}

/**
 * Inspect the limit for `key` WITHOUT recording an attempt.
 *
 * `allowed` is true while there is still room for one more attempt. When
 * blocked, `retryAfterMs` is the time until the oldest in-window attempt
 * expires and frees a slot.
 */
export function peekRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const { maxAttempts, windowMs } = config;
  const now = Date.now();

  const entry = store.get(key);
  if (!entry) {
    return { allowed: true, remaining: maxAttempts, retryAfterMs: 0 };
  }

  const ts = liveTimestamps(entry, now, windowMs);
  const allowed = ts.length < maxAttempts;
  const remaining = Math.max(0, maxAttempts - ts.length);
  const retryAfterMs = allowed || ts.length === 0 ? 0 : Math.max(0, ts[0] + windowMs - now);

  return { allowed, remaining, retryAfterMs };
}

/** Record one attempt for `key`. */
export function recordAttempt(key: string, config: RateLimitConfig): void {
  const now = Date.now();
  ensurePruner();

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [], windowMs: config.windowMs };
    store.set(key, entry);
  }
  entry.windowMs = config.windowMs;
  liveTimestamps(entry, now, config.windowMs).push(now);
}

/** Forget all attempts for `key` (e.g. after a legitimate success). */
export function clearRateLimit(key: string): void {
  store.delete(key);
}

/**
 * Check (and record) one attempt for the given `key` (typically the client IP).
 * Every call counts — use for brute-force / enumeration controls where even a
 * rejected attempt is meaningful.
 */
export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  recordAttempt(key, config);
  const entry = store.get(key)!;
  const count = entry.timestamps.length;
  const allowed = count <= config.maxAttempts;
  const remaining = Math.max(0, config.maxAttempts - count);
  const retryAfterMs =
    allowed || count === 0 ? 0 : Math.max(0, entry.timestamps[0] + config.windowMs - Date.now());

  return { allowed, remaining, retryAfterMs };
}
