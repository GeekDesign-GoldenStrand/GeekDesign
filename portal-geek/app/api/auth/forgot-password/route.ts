import { type NextRequest } from "next/server";

import { ForgotPasswordSchema } from "@/lib/schemas/auth";
import { requestPasswordReset } from "@/lib/services/password-reset";
import { ok } from "@/lib/utils/api";
import { handleError } from "@/lib/utils/errors";
import { checkRateLimit } from "@/lib/utils/rate-limit";
import { getClientIp } from "@/lib/utils/request-ip";

// D3: 5 attempts per IP per 15 min. Bound on IP only — adding an email-based
// bucket would expose a timing oracle ("known-email" path hits the throttle
// faster). Each call costs a DB upsert + Resend email; the limit keeps a
// hostile script from email-bombing a known user.
const FORGOT_RATE_LIMIT = { maxAttempts: 5, windowMs: 15 * 60_000 };

// Same generic reply the no-such-user path returns. Used for rate-limit too so
// throttled callers can't distinguish "blocked" from "delivered" — preserves
// the anti-enumeration shape.
const NEUTRAL_BODY = {
  message: "Si el correo existe, recibirás un enlace de recuperación.",
};

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const { allowed } = checkRateLimit(`forgot-pwd:${ip}`, FORGOT_RATE_LIMIT);
    if (!allowed) {
      // Silent throttle — same body as the success path.
      return ok(NEUTRAL_BODY);
    }

    const body = await request.json();
    const { email } = ForgotPasswordSchema.parse(body);
    await requestPasswordReset(email);
    return ok(NEUTRAL_BODY);
  } catch (err) {
    return handleError(err);
  }
}
