import type { Materiales } from "@prisma/client";

import { prisma } from "@/lib/db/client";
import type { CreateMaterialInput } from "@/lib/schemas/materiales";
import { ConflictError, NotFoundError } from "@/lib/utils/errors";

export async function listMateriales(
  page: number,
  pageSize: number
): Promise<{ items: Materiales[]; total: number }> {
  // Pagination.
  const [items, total] = await prisma.$transaction([
    prisma.materiales.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { nombre_material: "asc" },
    }),
    prisma.materiales.count(),
  ]);

  return { items, total };
}

export async function getMaterial(id: number): Promise<Materiales> {
  // Fetch material by primary key.
  const material = await prisma.materiales.findUnique({ where: { id_material: id } });

  if (!material) {
    throw new NotFoundError(`Material ${id} no encontrado`);
  }

  return material;
}

export async function createMaterial(data: CreateMaterialInput): Promise<Materiales> {
  // Persist a new material row using validated payload from the API schema.
  return prisma.materiales.create({ data });
}

export async function updateMaterial(id: number, data: CreateMaterialInput): Promise<Materiales> {
  try {
    const updated = await prisma.materiales.update({
      where: { id_material: id },
      data,
    });
    return updated;
  } catch (err) {
    // Prisma throws P2025 when record not found
    if (err instanceof Error && err.message.includes("P2025")) {
      throw new NotFoundError(`Material ${id} no encontrado`);
    }
    throw err;
  }
}

export async function deleteMaterial(id: number): Promise<void> {
  try {
    await prisma.$transaction(async (tx) => {
      const material = await tx.materiales.findUnique({
        where: { id_material: id },
        select: {
          id_material: true,
          opciones: { select: { id_opcion: true } },
          detallesPedido: { select: { id_detalle: true } },
          pedidoMaquinas: { select: { id_pedido_maquina: true } },
        },
      });

      if (!material) {
        throw new NotFoundError(`Material ${id} no encontrado`);
      }

      if (material.detallesPedido.length > 0 || material.pedidoMaquinas.length > 0) {
        throw new ConflictError(`Material ${id} no se puede eliminar porque ya está en uso`);
      }

      const optionIds = material.opciones.map((opcion) => opcion.id_opcion);

      if (optionIds.length > 0) {
        await tx.matrizDePrecios.deleteMany({
          where: { id_opcion: { in: optionIds } },
        });

        await tx.valoresOpcion.deleteMany({
          where: { id_opcion: { in: optionIds } },
        });

        await tx.opcionesProducto.deleteMany({
          where: { id_material: id },
        });
      }

      await tx.materiales.delete({
        where: { id_material: id },
      });
    });
  } catch (err) {
    if ((err as { code?: string }).code === "P2025") {
      throw new NotFoundError(`Material ${id} no encontrado`);
    }
    throw err;
  }
}
