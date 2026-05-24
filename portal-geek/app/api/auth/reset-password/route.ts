import { type NextRequest } from "next/server";
import { cookies } from "next/headers";

import { ResetPasswordSchema } from "@/lib/schemas/auth";
import { resetPassword } from "@/lib/services/password-reset";
import { ok } from "@/lib/utils/api";
import { handleError, UnauthorizedError } from "@/lib/utils/errors";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("reset_token")?.value;

    if (!token) {
      throw new UnauthorizedError("El enlace de recuperación es inválido o ya expiró.");
    }

    const body = await request.json();
    const { password } = ResetPasswordSchema.parse(body);
    
    await resetPassword(token, password);
    
    // Clear the cookie upon success
    cookieStore.delete("reset_token");
    
    return ok({ message: "Contraseña actualizada correctamente." });
  } catch (err) {
    return handleError(err);
  }
}
