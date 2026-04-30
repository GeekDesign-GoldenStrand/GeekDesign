import type { Maquinas } from "@prisma/client";

import { prisma } from "@/lib/db/client";
import type { CreateMaquinaInput, UpdateMaquinaInput } from "@/lib/schemas/maquinas";

/*
Paged list of machines with total count for pagination controls.
Sorted by id_maquina desc (most recently created first).
*/
export async function listMaquinas(page: number,pageSize: number): Promise<{ items: Maquinas[]; total: number }> {
  const skip = (page - 1) * pageSize;
  const [items, total] = await Promise.all([
    prisma.maquinas.findMany({
      skip,
      take: pageSize,
      orderBy: { id_maquina: "desc" },
    }),
    prisma.maquinas.count(),
  ]);

  return { items, total };
}

export async function getMaquina(id: number): Promise<Maquinas> {
  void id;
  throw new Error("Not implemented");
}

export async function createMaquina(data: CreateMaquinaInput): Promise<Maquinas> {
  void data;
  throw new Error("Not implemented");
}

export async function updateMaquina(id: number, data: UpdateMaquinaInput): Promise<Maquinas> {
  void id;
  void data;
  throw new Error("Not implemented");
}

export async function deleteMaquina(id: number): Promise<void> {
  void id;
  throw new Error("Not implemented");
}

