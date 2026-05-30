import { type NextRequest } from "next/server";

import { ResetPasswordSchema } from "@/lib/schemas/auth";
import { resetPassword } from "@/lib/services/password-reset";
import { ok } from "@/lib/utils/api";
import { handleError, UnauthorizedError } from "@/lib/utils/errors";
import { checkRateLimit } from "@/lib/utils/rate-limit";
import { getClientIp } from "@/lib/utils/request-ip";

// D4: 10 attempts per IP per 15 min. Each call hashes a password via bcrypt
// (CPU work), so an unbounded budget is a cheap DoS vector. Token entropy is
// 256 bits so this isn't gating brute-force on the secret itself; it's gating
// the bcrypt CPU cost.
const RESET_RATE_LIMIT = { maxAttempts: 10, windowMs: 15 * 60_000 };

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const { allowed } = checkRateLimit(`reset-pwd:${ip}`, RESET_RATE_LIMIT);
    if (!allowed) {
      throw new UnauthorizedError("Demasiados intentos. Intenta de nuevo en unos minutos.");
    }

    const body = await request.json();
    const { token, password } = ResetPasswordSchema.parse(body);
    await resetPassword(token, password);
    return ok({ message: "Contraseña actualizada correctamente." });
  } catch (err) {
    return handleError(err);
  }
}
