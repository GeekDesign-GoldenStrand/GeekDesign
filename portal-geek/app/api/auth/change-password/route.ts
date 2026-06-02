import { withAuth } from "@/lib/auth/guards";
import { ChangePasswordSchema } from "@/lib/schemas/auth";
import { changePassword } from "@/lib/services/change-password";
import { ok } from "@/lib/utils/api";
import { handleError, RateLimitError } from "@/lib/utils/errors";
import { checkRateLimit } from "@/lib/utils/rate-limit";

// Per-USER rate limit (not per-IP): the route is auth-gated, so the user is
// known and rate-limiting by id_usuario stops a session-hijacker from
// brute-forcing the current-password check without locking out everyone
// behind a shared NAT. Login uses 5/15min; change-password gets 10/15min
// since legitimate users sometimes mistype their current password.
const CHANGE_PASSWORD_RATE_LIMIT = { maxAttempts: 10, windowMs: 15 * 60_000 };

export const PUT = withAuth(async (req, session) => {
  try {
    const { allowed, retryAfterMs } = checkRateLimit(
      `change-password:${session.id}`,
      CHANGE_PASSWORD_RATE_LIMIT
    );
    if (!allowed) {
      throw RateLimitError.fromMs(retryAfterMs);
    }
    const body = ChangePasswordSchema.parse(await req.json());
    await changePassword(session.id, body.currentPassword, body.newPassword);
    return ok({ message: "Contraseña actualizada correctamente" });
  } catch (err) {
    return handleError(err);
  }
});
