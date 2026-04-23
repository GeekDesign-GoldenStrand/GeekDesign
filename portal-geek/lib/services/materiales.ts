import type { Materiales } from "@prisma/client";

import { prisma } from "@/lib/db/client";
import type { CreateMaterialInput, UpdateMaterialInput } from "@/lib/schemas/materiales";
import { NotFoundError } from "@/lib/utils/errors";

// Returns a paginated list of materials ordered by name.
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

// Returns one material by id or throws a 404-style domain error when it does not exist.
export async function getMaterial(id: number): Promise<Materiales> {
  const material = await prisma.materiales.findUnique({ where: { id_material: id } });
  if (!material) throw new NotFoundError(`Material ${id} no encontrado`);
  return material;
}

// Creates a new material record from validated input data.
export async function createMaterial(data: CreateMaterialInput): Promise<Materiales> {
  return prisma.materiales.create({ data });
}

// Updates a material by id and translates Prisma not-found errors into domain errors.
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

// Deletes a material by id and translates Prisma not-found errors into domain errors.
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
