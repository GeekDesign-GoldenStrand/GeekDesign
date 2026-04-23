import type { Servicios } from "@prisma/client";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/client";
import { NotFoundError } from "@/lib/utils/errors";
import type { CreateServicioInput, UpdateServicioInput } from "@/lib/schemas/servicios";

/*
Servicios list paginated with total count for pagination controls. Sorted by id_servicio desc (newest first).
*/
export async function listServicios(
  page: number,
  pageSize: number
): Promise<{ items: Servicios[]; total: number }> {
  // TODO: implement
  const skip = (page - 1) * pageSize;

  const [items, total] = await Promise.all([
    prisma.servicios.findMany({
      skip,
      take: pageSize,
      orderBy: { id_servicio: "desc" },
    }),
    prisma.servicios.count(),
  ]);

  return { items, total };
}

export async function getServicios(id: number): Promise<Servicios> {

  // TODO: implement — throw new NotFoundError(...) if not found
  void id;
  throw new Error("Not implemented");
}

export async function createServicio(data: CreateServicioInput): Promise<Servicios> {
  // TODO: implement
  void data;
  throw new Error("Not implemented");
}

export async function updateServicio(id: number, data: UpdateServicioInput): Promise<Servicios> {
  // TODO: implement — throw NotFoundError on Prisma P2025
  void id;
  void data;
  throw new Error("Not implemented");
}

export async function deleteServicio(id: number): Promise<void> {
  // TODO: implement
  void id;
  throw new Error("Not implemented");
}
