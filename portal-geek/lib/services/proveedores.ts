import type { Proveedores } from "@prisma/client";

import { prisma } from "@/lib/db/client";
import type { CreateProveedorInput, UpdateProveedorInput } from "@/lib/schemas/proveedores";
import { NotFoundError } from "@/lib/utils/errors";

export async function listProveedores(
  page: number,
  pageSize: number
): Promise<{ items: Proveedores[]; total: number }> {
  const where = { estatus: { not: "Inactivo" } };
  const [items, total] = await prisma.$transaction([
    prisma.proveedores.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { nombre_proveedor: "asc" },
    }),
    prisma.proveedores.count({ where }),
  ]);
  return { items, total };
}

export async function getProveedor(id: number): Promise<Proveedores> {
  const proveedor = await prisma.proveedores.findUnique({ where: { id_proveedor: id } });
  if (!proveedor) throw new NotFoundError(`Proveedor ${id} no encontrado`);
  return proveedor;
}

export async function createProveedor(data: CreateProveedorInput): Promise<Proveedores> {
  return prisma.proveedores.create({ data });
}

export async function updateProveedor(
  id: number,
  data: UpdateProveedorInput
): Promise<Proveedores> {
  try {
    return await prisma.proveedores.update({ where: { id_proveedor: id }, data });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2025") {
      throw new NotFoundError(`Proveedor ${id} no encontrado`);
    }
    throw err;
  }
}

export async function deleteProveedor(id: number): Promise<void> {
  try {
    await prisma.proveedores.update({
      where: { id_proveedor: id },
      data: { estatus: "Inactivo" },
    });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2025") {
      throw new NotFoundError(`Proveedor ${id} no encontrado`);
    }
    throw err;
  }
}
