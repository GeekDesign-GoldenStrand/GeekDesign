import { type NextRequest } from "next/server";

import { ForgotPasswordSchema } from "@/lib/schemas/auth";
import { requestPasswordReset } from "@/lib/services/password-reset";
import { ok } from "@/lib/utils/api";
import { handleError } from "@/lib/utils/errors";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = ForgotPasswordSchema.parse(body);
    await requestPasswordReset(email);
    return ok({ message: "Si el correo existe, recibirás un enlace de recuperación." });
  } catch (err) {
    return handleError(err);
  }
}
