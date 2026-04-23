import type { Materiales } from "@prisma/client";

import { prisma } from "@/lib/db/client";
import type { CreateMaterialInput, UpdateMaterialInput } from "@/lib/schemas/materiales";
import { NotFoundError } from "@/lib/utils/errors";

export async function listMateriales(
  page: number,
  pageSize: number
): Promise<{ items: Materiales[]; total: number }> {
  // Keep list and total count in the same transaction for consistent pagination.
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
  // Fetch one material by primary key.
  const material = await prisma.materiales.findUnique({ where: { id_material: id } });

  if (!material) {
    throw new NotFoundError(`Material ${id} no encontrado`);
  }

  return material;
}

export async function createMaterial(data: CreateMaterialInput): Promise<Materiales> {
  // TODO: implement
  void data;
  throw new Error("Not implemented");
}

export async function updateMaterial(id: number, data: UpdateMaterialInput): Promise<Materiales> {
  // TODO: implement — throw NotFoundError on Prisma P2025
  void id;
  void data;
  throw new Error("Not implemented");
}

export async function deleteMaterial(id: number): Promise<void> {
  // TODO: implement
  void id;
  throw new Error("Not implemented");
}
