import { type NextRequest } from "next/server";

import { ForgotPasswordSchema } from "@/lib/schemas/auth";
import { requestPasswordReset } from "@/lib/services/password-reset";
import { ok } from "@/lib/utils/api";
import { handleError, RateLimitError } from "@/lib/utils/errors";
import { checkRateLimit } from "@/lib/utils/rate-limit";
import { getClientIp } from "@/lib/utils/request-ip";

// Per-IP rate limit matches the storefront access-link endpoint: every attempt
// counts (this is the anti-enumeration control), but loose enough that a real
// user mistyping their email a few times isn't locked out. Without this, the
// endpoint leaks valid emails via response-time differences.
const FORGOT_RATE_LIMIT = { maxAttempts: 8, windowMs: 15 * 60_000 };

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const { allowed, retryAfterMs } = checkRateLimit(`forgot-password:${ip}`, FORGOT_RATE_LIMIT);
    if (!allowed) {
      throw RateLimitError.fromMs(retryAfterMs);
    }
    const body = await request.json();
    const { email } = ForgotPasswordSchema.parse(body);
    await requestPasswordReset(email);
    return ok({ message: "Si el correo existe, recibirás un enlace de recuperación." });
  } catch (err) {
    return handleError(err);
  }
}
