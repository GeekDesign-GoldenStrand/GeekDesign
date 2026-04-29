import type { Materiales } from "@prisma/client";

import { prisma } from "@/lib/db/client";
import type { CreateMaterialInput, UpdateMaterialInput } from "@/lib/schemas/materiales";

export async function listMateriales(
  page: number,
  pageSize: number
): Promise<{ items: Materiales[]; total: number }> {
  // TODO: implement
  void prisma;
  void page;
  void pageSize;
  throw new Error("Not implemented");
}

export async function getMaterial(id: number): Promise<Materiales> {
  // TODO: implement — throw new NotFoundError(...) if not found
  void id;
  throw new Error("Not implemented");
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
