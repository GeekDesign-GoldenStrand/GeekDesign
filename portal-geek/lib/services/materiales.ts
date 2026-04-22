import type { Materiales } from "@prisma/client";

import { prisma } from "@/lib/db/client";
import type { CreateMaterialInput, UpdateMaterialInput } from "@/lib/schemas/materiales";
import { NotFoundError } from "@/lib/utils/errors";

export async function listMateriales(
  page: number,
  pageSize: number
): Promise<{ items: Materiales[]; total: number }> {
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
  const material = await prisma.materiales.findUnique({ where: { id_material: id } });
  if (!material) throw new NotFoundError(`Material ${id} no encontrado`);
  return material;
}

export async function createMaterial(data: CreateMaterialInput): Promise<Materiales> {
  return prisma.materiales.create({ data });
}

export async function updateMaterial(id: number, data: UpdateMaterialInput): Promise<Materiales> {
  try {
    return await prisma.materiales.update({ where: { id_material: id }, data });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2025") {
      throw new NotFoundError(`Material ${id} no encontrado`);
    }
    throw err;
  }
}

export async function deleteMaterial(id: number): Promise<void> {
  try {
    await prisma.materiales.delete({ where: { id_material: id } });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2025") {
      throw new NotFoundError(`Material ${id} no encontrado`);
    }
    throw err;
  }
}
