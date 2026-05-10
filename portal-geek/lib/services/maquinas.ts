import type { Maquinas } from "@prisma/client";

import { prisma } from "@/lib/db/client";
import type { CreateMaquinaInput, UpdateMaquinaInput } from "@/lib/schemas/maquinas";
import { NotFoundError } from "@/lib/utils/errors";

export async function listMaquinas(
  page: number,
  pageSize: number
): Promise<{ items: Maquinas[]; total: number }> {
  const [items, total] = await prisma.$transaction([
    prisma.maquinas.findMany({
      where: {
        estatus: { not: "Inactiva" },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { fecha_registro: "asc" },
      include: {
        sucursales: {
          include: {
            sucursal: true,
          },
        },
        servicios: {
          include: {
            servicio: true,
          },
        },
      },
    }),
    prisma.maquinas.count(),
  ]);
  return { items, total };
}

export async function getMaquina(id: number): Promise<Maquinas> {
  // TODO: implement — throw new NotFoundError(...) if not found
  void id;
  throw new Error("Not implemented");
}

export async function createMaquina(data: CreateMaquinaInput): Promise<Maquinas> {
  // TODO: implement
  void data;
  throw new Error("Not implemented");
}

export async function updateMaquina(id: number, data: UpdateMaquinaInput): Promise<Maquinas> {
  try {
    return await prisma.instaladores.update({ where: { id_maquina: id }, data: data });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2025") {
      throw new NotFoundError(`Máquina ${id} no encontrada`);
    }
    throw err;
  }
}

export async function deleteMaquina(id: number): Promise<void> {
  try {
    await prisma.maquinas.update({
      where: { id_maquina: id },
      data: { estatus: "Inactiva" },
    });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2025") {
      throw new NotFoundError(`Maquina ${id} no encontrada`);
    }
    throw err;
  }
}
