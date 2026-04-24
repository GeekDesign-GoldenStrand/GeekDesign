import type { Servicios } from "@prisma/client";

import { prisma } from "@/lib/db/client";
import type { CreateServicioInput, UpdateServicioInput } from "@/lib/schemas/servicios";

export async function listServicios(
  page: number,
  pageSize: number
): Promise<{ items: Servicios[]; total: number }> {
  const [items, total] = await prisma.$transaction([
    prisma.servicios.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { nombre_servicio: "asc" },
      where: { estatus_servicio: true },
    }),
    prisma.servicios.count({ where: { estatus_servicio: true } }),
  ]);
  return { items, total };
}

export async function getServicio(id: number): Promise<Servicios> {
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
