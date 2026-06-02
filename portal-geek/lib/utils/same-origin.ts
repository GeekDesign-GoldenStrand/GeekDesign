import type { NextRequest } from "next/server";

import { ForbiddenError } from "@/lib/utils/errors";

/**
 * Same-origin guard for public storefront mutations.
 *
 * The Origin header is set by the browser on every cross-origin request (and
 * on same-origin POST/PUT/DELETE) and CANNOT be spoofed from JS — it is
 * controlled by the user agent. If the Origin doesn't match our app URL, the
 * request was initiated from another site (e.g. a competitor embedding our
 * price-calc endpoint) and we reject it.
 *
 * Falls back to Referer when Origin is missing (some legacy clients) and
 * rejects when neither is present on mutations — fail closed.
 */
export function assertSameOrigin(req: NextRequest): void {
  const expected = process.env.NEXT_PUBLIC_APP_URL;
  if (!expected) {
    // No allowlist configured → fail closed in production, allow in dev so
    // local tests against http://localhost still work.
    if (process.env.NODE_ENV === "production") {
      throw new ForbiddenError("Origen no permitido");
    }
    return;
  }
  const expectedOrigin = new URL(expected).origin;

  const origin = req.headers.get("origin");
  if (origin) {
    if (origin === expectedOrigin) return;
    throw new ForbiddenError("Origen no permitido");
  }

  const referer = req.headers.get("referer");
  if (referer) {
    try {
      const refOrigin = new URL(referer).origin;
      if (refOrigin === expectedOrigin) return;
    } catch {
      // fall through to reject
    }
  }

  throw new ForbiddenError("Origen no permitido");
}
