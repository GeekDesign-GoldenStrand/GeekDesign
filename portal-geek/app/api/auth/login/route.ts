import type { NextRequest } from "next/server";

import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/lib/auth/session";
import { LoginSchema } from "@/lib/schemas/auth";
import { loginUser } from "@/lib/services/auth";
import { ok } from "@/lib/utils/api";
import { UnauthorizedError, handleError } from "@/lib/utils/errors";
import { checkRateLimit } from "@/lib/utils/rate-limit";

/** 5 attempts per IP in a 15-minute window. */
const LOGIN_RATE_LIMIT = { maxAttempts: 5, windowMs: 15 * 60_000 };

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

    const { allowed } = checkRateLimit(ip, LOGIN_RATE_LIMIT);
    if (!allowed) {
      // Same generic message as bad credentials — no info leakage.
      throw new UnauthorizedError("Credenciales inválidas");
    }

    const body = await req.json();
    const { email, password } = LoginSchema.parse(body);

    const { token, user } = await loginUser(email, password);

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
