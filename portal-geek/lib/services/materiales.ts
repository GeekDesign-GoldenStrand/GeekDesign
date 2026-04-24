import type { Materiales } from "@prisma/client";

import { prisma } from "@/lib/db/client";
import type { CreateMaterialInput, UpdateMaterialInput } from "@/lib/schemas/materiales";
import { NotFoundError } from "@/lib/utils/errors";

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

export async function updateMaterial(id: number, data: UpdateMaterialInput): Promise<Materiales> {
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
    await prisma.materiales.delete({
      where: { id_material: id },
    });
  } catch (err) {
    // Prisma throws P2025 when record not found
    if (err instanceof Error && err.message.includes("P2025")) {
      throw new NotFoundError(`Material ${id} no encontrado`);
    }
    throw err;
  }
}
