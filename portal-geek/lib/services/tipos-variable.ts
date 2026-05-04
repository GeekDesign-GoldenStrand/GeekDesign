import type { TiposVariable } from "@prisma/client";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/client";
import type {
  CreateTipoVariableInput,
  UpdateTipoVariableInput,
} from "@/lib/schemas/tipos-variable";
import { NotFoundError } from "@/lib/utils/errors";

export async function listTiposVariable(): Promise<TiposVariable[]> {
  return prisma.tiposVariable.findMany({
    where: { estatus: "Activo" },
    orderBy: { nombre_tipo: "asc" },
  });
}

export async function getTipoVariable(id: number): Promise<TiposVariable> {
  const tipo = await prisma.tiposVariable.findUnique({
    where: { id_tipo_variable: id },
  });

  if (!tipo) {
    throw new NotFoundError(`Tipo de variable con id ${id} no encontrado`);
  }

  return tipo;
}

export async function createTipoVariable(data: CreateTipoVariableInput): Promise<TiposVariable> {
  return prisma.tiposVariable.create({ data });
}

export async function updateTipoVariable(
  id: number,
  data: UpdateTipoVariableInput
): Promise<TiposVariable> {
  try {
    return await prisma.tiposVariable.update({
      where: { id_tipo_variable: id },
      data,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new NotFoundError(`Tipo de variable con id ${id} no encontrado`);
    }
    throw error;
  }
}

/**
 * Soft delete: marca como "Inactivo" para no perder referencias históricas
 * en fórmulas que ya usan este tipo.
 */
export async function deleteTipoVariable(id: number): Promise<void> {
  try {
    await prisma.tiposVariable.update({
      where: { id_tipo_variable: id },
      data: { estatus: "Inactivo" },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new NotFoundError(`Tipo de variable con id ${id} no encontrado`);
    }
    throw error;
  }
}
