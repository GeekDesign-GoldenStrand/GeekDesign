/**
 * In-memory sliding-window rate limiter.
 *
 * Designed for auth endpoints: when the limit is exceeded the caller can
 * return the **same generic error** used for bad credentials so attackers
 * cannot distinguish "wrong password" from "rate-limited".
 */

interface Entry {
  /** Timestamps (ms) of each attempt inside the current window. */
  timestamps: number[];
}

const store = new Map<string, Entry>();

// Periodically purge stale keys so the Map doesn't grow forever.
const PRUNE_INTERVAL_MS = 60_000; // every 1 min
let pruneTimer: ReturnType<typeof setInterval> | null = null;

function ensurePruner(windowMs: number) {
  if (pruneTimer) return;
  pruneTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      // Remove entries whose newest attempt is older than the window.
      if (
        entry.timestamps.length === 0 ||
        entry.timestamps[entry.timestamps.length - 1] < now - windowMs
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
}

/**
 * Check (and record) one attempt for the given `key` (typically the client IP).
 *
 * ```ts
 * const { allowed } = checkRateLimit(ip, { maxAttempts: 5, windowMs: 15 * 60_000 });
 * if (!allowed) {
 *   // Return the same generic 401 — no info leakage.
 *   throw new UnauthorizedError("Credenciales inválidas");
 * }
 * ```
 */
export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const { maxAttempts, windowMs } = config;
  const now = Date.now();

  ensurePruner(windowMs);

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Drop attempts outside the sliding window.
  entry.timestamps = entry.timestamps.filter((t) => t > now - windowMs);

  // Record this attempt.
  entry.timestamps.push(now);

  const allowed = entry.timestamps.length <= maxAttempts;
  const remaining = Math.max(0, maxAttempts - entry.timestamps.length);

  return { allowed, remaining };
}
