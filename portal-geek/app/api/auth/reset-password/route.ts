import { type NextRequest } from "next/server";

import { ResetPasswordSchema } from "@/lib/schemas/auth";
import { resetPassword } from "@/lib/services/password-reset";
import { ok } from "@/lib/utils/api";
import { handleError } from "@/lib/utils/errors";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = ResetPasswordSchema.parse(body);
    await resetPassword(token, password);
    return ok({ message: "Contraseña actualizada correctamente." });
  } catch (err) {
    return handleError(err);
  }
}
