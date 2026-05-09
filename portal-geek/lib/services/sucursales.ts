import type { Sucursales } from "@prisma/client";

import { prisma } from "@/lib/db/client";
import type { CreateSucursalInput, UpdateSucursalInput } from "@/lib/schemas/sucursales";

export type SucursalWithRelations = Sucursales;

export async function listSucursales(page: number, pageSize: number) {
  const skip = (page - 1) * pageSize;

  const [items, total] = await Promise.all([
    prisma.sucursales.findMany({
      skip,
      take: pageSize,
      orderBy: { id_sucursal: "asc" },
    }),
    prisma.sucursales.count(),
  ]);

  return { items, total };
}

export async function getSucursal(id: number): Promise<Sucursales> {
  // TODO: implement — throw new NotFoundError(...) if not found
  void id;
  throw new Error("Not implemented");
}

export async function createSucursal(data: CreateSucursalInput): Promise<Sucursales> {
  // TODO: implement
  void data;
  throw new Error("Not implemented");
}

export async function updateSucursal(id: number, data: UpdateSucursalInput): Promise<Sucursales> {
  // TODO: implement — throw NotFoundError on Prisma P2025
  void id;
  void data;
  throw new Error("Not implemented");
}

export async function deleteSucursal(id: number): Promise<void> {
  // TODO: implement
  void id;
  throw new Error("Not implemented");
}
