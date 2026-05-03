import type { Proveedores } from "@prisma/client";

import { prisma } from "@/lib/db/client";
import type { CreateProveedorInput, UpdateProveedorInput } from "@/lib/schemas/proveedores";
import { NotFoundError } from "@/lib/utils/errors";

export async function listProveedores(
  page: number,
  pageSize: number
): Promise<{ items: Proveedores[]; total: number }> {
  const [items, total] = await prisma.$transaction([
    prisma.proveedores.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { nombre_proveedor: "asc" },
    }),
    prisma.proveedores.count(),
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
    await prisma.proveedores.delete({ where: { id_proveedor: id } });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2025") {
      throw new NotFoundError(`Proveedor ${id} no encontrado`);
    }
    throw err;
  }
}

// Returns the minimal payload needed to render the provider dropdown
// in the service form. Only active service providers, ordered by cost asc.

export async function getProveedoresOptions(): Promise<
  Array<{
    id_proveedor: number;
    nombre_proveedor: string;
    costo: string | null;
  }>
> {
  const proveedores = await prisma.proveedores.findMany({
    where: {
      estatus: "Activo",
      tipo: "Proveedor de servicio",
    },
    select: {
      id_proveedor: true,
      nombre_proveedor: true,
      costo: true,
    },
    orderBy: { costo: "asc" },
  });

  // Prisma returns Decimal as a Decimal object; serialize to string for the client component.
  return proveedores.map((p) => ({
    ...p,
    costo: p.costo ? p.costo.toString() : null,
  }));
}