import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db/client";
import type { CreateUsuarioInput, UpdateUsuarioInput } from "@/lib/schemas/usuarios";
import { NotFoundError } from "@/lib/utils/errors";

const USER_SELECT = {
  id_usuario: true,
  nombre_completo: true,
  correo_electronico: true,
  id_rol: true,
  estatus: true,
  fecha_creacion: true,
  ultimo_acceso: true,
  rol: { select: { id_rol: true, nombre_rol: true } },
} as const;

export async function listUsuarios(page: number, pageSize: number) {
  const skip = (page - 1) * pageSize;
  const [items, total] = await prisma.$transaction([
    prisma.usuarios.findMany({
      skip,
      take: pageSize,
      select: USER_SELECT,
      orderBy: { fecha_creacion: "desc" },
    }),
    prisma.usuarios.count(),
  ]);
  return { items, total };
}

export async function getUsuario(id: number) {
  const usuario = await prisma.usuarios.findUnique({
    where: { id_usuario: id },
    select: USER_SELECT,
  });
  if (!usuario) throw new NotFoundError("Usuario no encontrado");
  return usuario;
}

export async function createUsuario(data: CreateUsuarioInput) {
  const { contrasena, ...rest } = data;
  const contrasena_hash = await hashPassword(contrasena);
  return prisma.usuarios.create({ data: { ...rest, contrasena_hash }, select: USER_SELECT });
}

export async function updateUsuario(id: number, data: UpdateUsuarioInput) {
  try {
    return await prisma.usuarios.update({ where: { id_usuario: id }, data, select: USER_SELECT });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2025")
      throw new NotFoundError("Usuario no encontrado");
    throw err;
  }
}

export async function deleteUsuario(id: number): Promise<void> {
  try {
    await prisma.usuarios.update({ where: { id_usuario: id }, data: { estatus: "Inactivo" } });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2025")
      throw new NotFoundError("Usuario no encontrado");
    throw err;
  }
}
