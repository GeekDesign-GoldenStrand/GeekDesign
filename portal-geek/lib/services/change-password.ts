import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db/client";
import { NotFoundError, UnauthorizedError, ValidationError } from "@/lib/utils/errors";

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
  if (!usuario.contrasena_hash)
    throw new UnauthorizedError("La cuenta no tiene contraseña configurada");

  const valid = await verifyPassword(currentPassword, usuario.contrasena_hash);
  // ValidationError (422), not UnauthorizedError (401). The session IS valid;
  // only the body field is wrong. A 401 here would collide with the client's
  // session-expiry handler (logout + redirect to /login), making a failed
  // change indistinguishable from a successful one to the user.
  if (!valid) throw new ValidationError("La contraseña actual es incorrecta");

  const newHash = await hashPassword(newPassword);
  await prisma.usuarios.update({
    where: { id_usuario: userId },
    data: { contrasena_hash: newHash },
  });
}
