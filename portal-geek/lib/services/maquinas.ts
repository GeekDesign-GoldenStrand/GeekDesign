import type { Maquinas } from "@prisma/client";

import { prisma } from "@/lib/db/client";
import type { CreateMaquinaInput, UpdateMaquinaInput } from "@/lib/schemas/maquinas";

export async function listMaquinas(
  page: number,
  pageSize: number
): Promise<{ items: Maquinas[]; total: number }> {
  // TODO: implement
  void prisma;
  void page;
  void pageSize;
  throw new Error("Not implemented");
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
  // TODO: implement — throw NotFoundError on Prisma P2025
  void id;
  void data;
  throw new Error("Not implemented");
}

export async function deleteMaquina(id: number): Promise<void> {
  // TODO: implement
  void id;
  throw new Error("Not implemented");
}
