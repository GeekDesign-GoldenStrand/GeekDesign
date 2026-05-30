import { cookies } from "next/headers";
import { type NextRequest } from "next/server";
import { z } from "zod";

import { resetPassword } from "@/lib/services/password-reset";
import { ok } from "@/lib/utils/api";
import { handleError, UnauthorizedError } from "@/lib/utils/errors";
import { checkRateLimit } from "@/lib/utils/rate-limit";
import { getClientIp } from "@/lib/utils/request-ip";

// D4: same bound as /api/auth/reset-password — gates bcrypt CPU per IP.
const ESTABLECER_RATE_LIMIT = { maxAttempts: 10, windowMs: 15 * 60_000 };

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
    const ip = getClientIp(request);
    const { allowed } = checkRateLimit(`establecer-pwd:${ip}`, ESTABLECER_RATE_LIMIT);
    if (!allowed) {
      throw new UnauthorizedError("Demasiados intentos. Intenta de nuevo en unos minutos.");
    }

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
