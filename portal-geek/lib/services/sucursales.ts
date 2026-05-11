import { prisma } from "@/lib/db/client";
import type { CreateSucursalInput, UpdateSucursalInput } from "@/lib/schemas/sucursales";
import { NotFoundError } from "@/lib/utils/errors";

export async function listSucursales(page: number, pageSize: number) {
  const skip = (page - 1) * pageSize;
  const where = { estatus: "Activo" };
  const [items, total] = await prisma.$transaction([
    prisma.sucursales.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { nombre_sucursal: "asc" },
    }),
    prisma.sucursales.count({ where }),
  ]);
  return { items, total };
}

export async function getSucursal(id: number) {
  const sucursal = await prisma.sucursales.findUnique({ where: { id_sucursal: id } });
  if (!sucursal) throw new NotFoundError("Sucursal no encontrada");
  return sucursal;
}

export async function createSucursal(data: CreateSucursalInput) {
  return prisma.sucursales.create({ data });
}

export async function updateSucursal(id: number, data: UpdateSucursalInput) {
  try {
    return await prisma.sucursales.update({ where: { id_sucursal: id }, data });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2025")
      throw new NotFoundError("Sucursal no encontrada");
    throw err;
  }
}

export async function deleteSucursal(id: number): Promise<void> {
  try {
    await prisma.sucursales.update({ where: { id_sucursal: id }, data: { estatus: "Inactivo" } });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2025")
      throw new NotFoundError("Sucursal no encontrada");
    throw err;
  }
}
