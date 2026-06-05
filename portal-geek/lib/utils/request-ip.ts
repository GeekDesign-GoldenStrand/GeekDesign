import type { NextRequest } from "next/server";

/**
 * Best-effort client IP for per-IP abuse controls (rate limiting).
 *
 * GCP (App Engine / Cloud Load Balancing) **appends** the real client IP to the
 * RIGHT of `X-Forwarded-For` and never validates or strips client-supplied
 * values, which stay on the LEFT. So the right-most entry is the only one we can
 * trust. Reading the left-most (`split(",")[0]`) lets any client send
 * `X-Forwarded-For: <random>` and mint a fresh bucket per request, bypassing
 * every per-IP limit. We therefore read from the right.
 *
 * See: https://adam-p.ca/blog/2022/03/x-forwarded-for/
 *
 * NOTE: assumes exactly one trusted proxy hop (App Engine's front end). If the
 * topology ever gains another trusted proxy, this must skip that many hops from
 * the right instead of taking the last entry.
 */
export function getClientIp(req: NextRequest, fallback = "unknown"): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1];
  }
  return req.headers.get("x-real-ip")?.trim() || fallback;
}
