import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db/client";
import { NotFoundError, UnauthorizedError } from "@/lib/utils/errors";

export async function changePassword(
  userId: number,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const usuario = await prisma.usuarios.findUnique({
    where: { id_usuario: userId },
    select: { contrasena_hash: true },
  });

  if (!usuario) throw new NotFoundError("Usuario no encontrado");

  const valid = await verifyPassword(currentPassword, usuario.contrasena_hash);
  if (!valid) throw new UnauthorizedError("La contraseña actual es incorrecta");

  const newHash = await hashPassword(newPassword);
  await prisma.usuarios.update({
    where: { id_usuario: userId },
    data: { contrasena_hash: newHash },
  });
}
