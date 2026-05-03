import type { Maquinas } from "@prisma/client";

import { prisma } from "@/lib/db/client";
import type { CreateMaquinaInput, UpdateMaquinaInput } from "@/lib/schemas/maquinas";


export async function listMaquinas(
  page: number,
  pageSize: number
): Promise<{ items: Maquinas[]; total: number }> {
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


// Returns all active machines for dropdowns, 
// After the admin choses a branch in the service form, we need 
// to show only the machines linked to that branch and that are active.

export async function getMaquinasOptionsBySucursal(
  idSucursal: number
): Promise <
  Array<{
    id_maquina: number;
    nombre_maquina: string;
    apodo_maquina: string;
    tipo: string;
  }>
> {
  const rows = await prisma.sucursalesMaquina.findMany({
    where: {
      id_sucursal: idSucursal,
      maquina: { estatus: "Activa" },
    },
    select: {
      maquina: {
        select: {
          id_maquina: true,
          nombre_maquina: true,
          apodo_maquina: true,
          tipo: true,
        },
      },
    },
    orderBy: { maquina: { apodo_maquina: "asc" } },
  });

  // Flatten the nested shape from the pivot.
  return rows.map((r) => r.maquina);
}