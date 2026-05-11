import type { Sucursales } from "@prisma/client";

import { prisma } from "@/lib/db/client";
import type { CreateSucursalInput, UpdateSucursalInput } from "@/lib/schemas/sucursales";

export async function listSucursales(
  page: number,
  pageSize: number
): Promise<{ items: Sucursales[]; total: number }> {
  const [items, total] = await Promise.all([
    prisma.sucursales.findMany({
      where: { estatus: "Activo" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { nombre_sucursal: "asc" },
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
