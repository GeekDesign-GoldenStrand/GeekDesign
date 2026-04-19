import type { NextRequest } from "next/server";

import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/lib/auth/session";
import { LoginSchema } from "@/lib/schemas/auth";
import { loginUser } from "@/lib/services/auth";
import { ok } from "@/lib/utils/api";
import { handleError } from "@/lib/utils/errors";

export async function POST(req: NextRequest) {
  try {
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
