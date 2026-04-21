import { verifyPassword } from "@/lib/auth/password";
import { generateToken } from "@/lib/auth/tokens";
import { prisma } from "@/lib/db/client";
import { UnauthorizedError } from "@/lib/utils/errors";
import type { UserRole } from "@/types";

export interface LoginResult {
  token: string;
  user: {
    id: number;
    nombre_completo: string;
    correo_electronico: string;
    rol: UserRole;
  };
}

export async function loginUser(email: string, password: string): Promise<LoginResult> {
  const normalizedEmail = email.trim().toLowerCase();

  const usuario = await prisma.usuarios.findUnique({
    where: { correo_electronico: normalizedEmail },
    include: { rol: true },
  });

  // Same error for missing user + bad password — avoids leaking which is wrong.
  if (!usuario || usuario.estatus !== "Activo") {
    throw new UnauthorizedError("Credenciales inválidas");
  }

  const valid = await verifyPassword(password, usuario.contrasena_hash);
  if (!valid) {
    throw new UnauthorizedError("Credenciales inválidas");
  }

  const rol = usuario.rol.nombre_rol as UserRole;

  const token = await generateToken({
    id: usuario.id_usuario,
    email: usuario.correo_electronico,
    rol,
  });

  await prisma.usuarios.update({
    where: { id_usuario: usuario.id_usuario },
    data: { ultimo_acceso: new Date() },
  });

  return {
    token,
    user: {
      id: usuario.id_usuario,
      nombre_completo: usuario.nombre_completo,
      correo_electronico: usuario.correo_electronico,
      rol,
    },
  };
}
