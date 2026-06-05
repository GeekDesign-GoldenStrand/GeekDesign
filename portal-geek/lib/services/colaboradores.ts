import type { Prisma } from "@prisma/client";

import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db/client";
import type { CreateColaboradorInput, UpdateColaboradorInput } from "@/lib/schemas/colaboradores";
import { sendWelcomeEmailForColaborador } from "@/lib/services/password-reset";
import { ConflictError, NotFoundError } from "@/lib/utils/errors";

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

export interface ListColaboradoresFilters {
  search?: string;
  estatusColaborador?: string;
  roles?: number[];
}

export async function listColaboradores(
  page: number,
  pageSize: number,
  filters: ListColaboradoresFilters = {}
) {
  const skip = (page - 1) * pageSize;

  // Búsqueda y filtros se aplican en el servidor para que recorran TODOS los
  // colaboradores, no solo la página cargada.
  const where: Prisma.UsuariosWhereInput = {
    estatus: { not: "Inactivo" },
    // El filtro de estatus_colaborador (vía relación) ya exige que exista el
    // colaborador; si no se filtra, basta con que la relación no sea nula.
    colaborador: filters.estatusColaborador
      ? { is: { estatus_colaborador: filters.estatusColaborador } }
      : { isNot: null },
  };

  const search = filters.search?.trim();
  if (search) {
    where.OR = [
      { nombre_completo: { contains: search, mode: "insensitive" } },
      { correo_electronico: { contains: search, mode: "insensitive" } },
    ];
  }

  if (filters.roles && filters.roles.length > 0) {
    where.id_rol = { in: filters.roles };
  }

  const [items, total] = await prisma.$transaction([
    prisma.usuarios.findMany({
      skip,
      take: pageSize,
      where,
      select: COLABORADOR_SELECT,
      orderBy: { fecha_creacion: "desc" },
    }),
    prisma.usuarios.count({ where }),
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
    id_rol,
    estatus,
    id_sucursal,
    edad,
    sexo,
    telefono,
    estatus_colaborador,
  } = data;

  const normalizedEmail = correo_electronico.trim().toLowerCase();

  // Verify if there is an existing user with that mail
  const existingUser = await prisma.usuarios.findUnique({
    where: { correo_electronico: normalizedEmail },
    include: { colaborador: true },
  });

  let usuario;

  if (existingUser) {
    // if the user already has a password configured, it's a duplicate conflict
    if (existingUser.contrasena_hash !== null) {
      throw new ConflictError("El correo electrónico ya está registrado");
    }

    // if it exists but no password, we reuse and update
    usuario = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.usuarios.update({
        where: { id_usuario: existingUser.id_usuario },
        data: {
          nombre_completo,
          id_rol,
          estatus,
        },
        select: COLABORADOR_SELECT,
      });

      if (existingUser.colaborador) {
        await tx.colaboradores.update({
          where: { id_usuario: existingUser.id_usuario },
          data: {
            id_sucursal,
            edad,
            sexo,
            telefono,
            estatus_colaborador,
          },
        });
      } else {
        await tx.colaboradores.create({
          data: {
            id_usuario: existingUser.id_usuario,
            id_sucursal,
            edad,
            sexo,
            telefono,
            estatus_colaborador,
          },
        });
      }

      return updatedUser;
    });
  } else {
    // normal creation flow
    try {
      usuario = await prisma.usuarios.create({
        data: {
          nombre_completo,
          correo_electronico: normalizedEmail,
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
    } catch (err: unknown) {
      if ((err as { code?: string }).code === "P2002")
        throw new ConflictError("El correo electrónico ya está registrado");
      throw err;
    }
  }

  try {
    await sendWelcomeEmailForColaborador(
      usuario.id_usuario,
      usuario.correo_electronico,
      usuario.nombre_completo
    );
    return usuario;
  } catch (err) {
    // if sending mail fails, manual rollback kicks in
    await prisma
      .$transaction([
        prisma.tokensRecuperacion.deleteMany({ where: { id_usuario: usuario.id_usuario } }),
        prisma.colaboradores.deleteMany({ where: { id_usuario: usuario.id_usuario } }),
        prisma.usuarios.delete({ where: { id_usuario: usuario.id_usuario } }),
      ])
      .catch((rollbackErr) => {
        console.error("[rollback] Falló al eliminar el usuario tras error de correo:", rollbackErr);
      });

    throw err;
  }
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
    if ((err as { code?: string }).code === "P2002")
      throw new ConflictError("El correo electrónico ya está registrado");
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
