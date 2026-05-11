import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db/client";
import type { CreateColaboradorInput, UpdateColaboradorInput } from "@/lib/schemas/colaboradores";
import { NotFoundError } from "@/lib/utils/errors";

const COLABORADOR_SELECT = {
  id_usuario: true,
  nombre_completo: true,
  correo_electronico: true,
  id_rol: true,
  estatus: true,
  rol: { select: { id_rol: true, nombre_rol: true } },
  colaborador: {
    select: {
      id_colaborador: true,
      edad: true,
      sexo: true,
      telefono: true,
      estatus_colaborador: true,
      fecha_modificacion: true,
      sucursal: { select: { id_sucursal: true, nombre_sucursal: true } },
    },
  },
} as const;

export async function listColaboradores(page: number, pageSize: number) {
  const skip = (page - 1) * pageSize;
  const [items, total] = await prisma.$transaction([
    prisma.usuarios.findMany({
      skip,
      take: pageSize,
      where: { colaborador: { isNot: null }, estatus: { not: "Inactivo" } },
      select: COLABORADOR_SELECT,
      orderBy: { fecha_creacion: "desc" },
    }),
    prisma.usuarios.count({
      where: { colaborador: { isNot: null }, estatus: { not: "Inactivo" } },
    }),
  ]);
  return { items, total };
}

export async function getColaborador(id: number) {
  const usuario = await prisma.usuarios.findUnique({
    where: { id_usuario: id },
    select: COLABORADOR_SELECT,
  });
  if (!usuario || !usuario.colaborador) throw new NotFoundError("Colaborador no encontrado");
  return usuario;
}

export async function createColaborador(data: CreateColaboradorInput) {
  const {
    nombre_completo,
    correo_electronico,
    contrasena_hash: plainPassword,
    id_rol,
    estatus,
    id_sucursal,
    edad,
    sexo,
    telefono,
    estatus_colaborador,
  } = data;

  const contrasena_hash = await hashPassword(plainPassword);

  return prisma.usuarios.create({
    data: {
      nombre_completo,
      correo_electronico,
      contrasena_hash,
      id_rol,
      estatus,
      colaborador: {
        create: {
          id_sucursal,
          edad,
          sexo,
          telefono,
          estatus_colaborador,
        },
      },
    },
    select: COLABORADOR_SELECT,
  });
}

export async function updateColaborador(id: number, data: UpdateColaboradorInput) {
  const {
    nombre_completo,
    correo_electronico,
    contrasena_hash: plainPassword,
    id_rol,
    estatus,
    id_sucursal,
    edad,
    sexo,
    telefono,
    estatus_colaborador,
  } = data;

  const usuarioData: Record<string, unknown> = {};
  if (nombre_completo !== undefined) usuarioData.nombre_completo = nombre_completo;
  if (correo_electronico !== undefined) usuarioData.correo_electronico = correo_electronico;
  if (plainPassword !== undefined) usuarioData.contrasena_hash = await hashPassword(plainPassword);
  if (id_rol !== undefined) usuarioData.id_rol = id_rol;
  if (estatus !== undefined) usuarioData.estatus = estatus;

  const colaboradorData: Record<string, unknown> = {};
  if (id_sucursal !== undefined) colaboradorData.id_sucursal = id_sucursal;
  if (edad !== undefined) colaboradorData.edad = edad;
  if (sexo !== undefined) colaboradorData.sexo = sexo;
  if (telefono !== undefined) colaboradorData.telefono = telefono;
  if (estatus_colaborador !== undefined) colaboradorData.estatus_colaborador = estatus_colaborador;

  try {
    return await prisma.usuarios.update({
      where: { id_usuario: id },
      data: {
        ...usuarioData,
        ...(Object.keys(colaboradorData).length
          ? { colaborador: { update: colaboradorData } }
          : {}),
      },
      select: COLABORADOR_SELECT,
    });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2025")
      throw new NotFoundError("Colaborador no encontrado");
    throw err;
  }
}

export async function deleteColaborador(id: number): Promise<void> {
  try {
    await prisma.usuarios.update({
      where: { id_usuario: id },
      data: {
        estatus: "Inactivo",
        colaborador: { update: { estatus_colaborador: "Inactivo" } },
      },
    });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2025")
      throw new NotFoundError("Colaborador no encontrado");
    throw err;
  }
}
