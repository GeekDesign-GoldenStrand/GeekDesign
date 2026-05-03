import type { Sucursales } from "@prisma/client";

import { prisma } from "@/lib/db/client";
import type { CreateSucursalInput, UpdateSucursalInput } from "@/lib/schemas/sucursales";

export async function listSucursales(
  page: number,
  pageSize: number
): Promise<{ items: Sucursales[]; total: number }> {
  // TODO: implement
  void prisma;
  void page;
  void pageSize;
  throw new Error("Not implemented");
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


// Additional helper to the list dropdown in order to not show unactive sucursales.
export async function getSucursalesOptions(): Promise<Array<{ id_sucursal: number; nombre_sucursal: string }>> {
  return prisma.sucursales.findMany({
    where: { estatus: "Activo" },
    select: { id_sucursal: true, nombre_sucursal: true },
    orderBy: { nombre_sucursal: "asc" },
  }); 

}
