import { cookies } from "next/headers";
import { type NextRequest } from "next/server";
import { z } from "zod";

import { resetPassword } from "@/lib/services/password-reset";
import { ok } from "@/lib/utils/api";
import { handleError, UnauthorizedError } from "@/lib/utils/errors";

const EstablecerPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .max(255)
      .regex(/[A-Z]/, "La contraseña debe contener al menos una mayúscula")
      .regex(/[0-9]/, "La contraseña debe contener al menos un número"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("reset_token")?.value;

    if (!token) {
      throw new UnauthorizedError("El enlace de configuración es inválido o ya expiró.");
    }

    const body = await request.json();
    const { password } = EstablecerPasswordSchema.parse(body);

    await resetPassword(token, password);

    // Clear the cookie upon success
    cookieStore.delete("reset_token");

    return ok({ message: "Contraseña configurada correctamente." });
  } catch (err) {
    return handleError(err);
  }
}
