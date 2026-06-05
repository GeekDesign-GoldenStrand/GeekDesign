import type { NextRequest } from "next/server";

import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/lib/auth/session";
import { LoginSchema } from "@/lib/schemas/auth";
import { loginUser } from "@/lib/services/auth";
import { ok } from "@/lib/utils/api";
import { UnauthorizedError, handleError } from "@/lib/utils/errors";
import { clearRateLimit, peekRateLimit, recordAttempt } from "@/lib/utils/rate-limit";
import { getClientIp } from "@/lib/utils/request-ip";

/** 5 failed attempts per IP in a 15-minute window. */
const LOGIN_RATE_LIMIT = { maxAttempts: 5, windowMs: 15 * 60_000 };

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);

    // ANTI-ENUMERATION: a rate-limited login must be indistinguishable from bad
    // credentials — same 401, same message, and NO Retry-After header — so an
    // attacker cannot tell whether they were throttled or simply guessed wrong.
    const { allowed } = peekRateLimit(ip, LOGIN_RATE_LIMIT);
    if (!allowed) {
      throw new UnauthorizedError("Credenciales inválidas");
    }

    const body = await req.json();
    const { email, password } = LoginSchema.parse(body);

    let result;
    try {
      result = await loginUser(email, password);
    } catch (authErr) {
      // Only failed credential checks count toward the lockout — a valid login
      // never erodes the budget, and validation (422) errors are not guesses.
      if (authErr instanceof UnauthorizedError) {
        recordAttempt(ip, LOGIN_RATE_LIMIT);
      }
      throw authErr;
    }

    // Successful sign-in resets the counter so a legitimate user is never
    // penalised for earlier typos (or someone else behind a shared IP).
    clearRateLimit(ip);
    const { token, user } = result;

    const response = ok({ user });
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
    return response;
  } catch (err) {
    return handleError(err);
  }
}
