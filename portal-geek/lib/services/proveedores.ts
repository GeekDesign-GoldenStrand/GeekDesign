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
  return prisma.proveedores.create({
    data: {
      ...data,
      telefono: data.telefono,
      correo: data.correo,
    },
  });
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

export async function getProviderAssignments(id: number) {
  const assignments = await prisma.proveedorPrecios.findMany({
    where: { id_proveedor: id },
    select: { id_servicio: true, id_material: true },
  });

  return {
    serviceIds: assignments.map((a) => a.id_servicio).filter((id): id is number => id !== null),
    materialIds: assignments.map((a) => a.id_material).filter((id): id is number => id !== null),
  };
}

export async function syncProviderAssignments(
  id: number,
  type: "servicio" | "material",
  ids: number[]
) {
  const isServicio = type === "servicio";

  const current = await prisma.proveedorPrecios.findMany({
    where: {
      id_proveedor: id,
      id_servicio: isServicio ? { not: null } : undefined,
      id_material: !isServicio ? { not: null } : undefined,
    },
  });

  const currentIds = current
    .map((c) => (isServicio ? c.id_servicio : c.id_material))
    .filter((v): v is number => v !== null);

  const toAdd = ids.filter((id) => !currentIds.includes(id));
  const toRemove = current
    .filter((c) => {
      const cid = isServicio ? c.id_servicio : c.id_material;
      return cid !== null && !ids.includes(cid);
    })
    .map((c) => c.id_proveedor_precio);

  const operations = [
    prisma.proveedorPrecios.deleteMany({
      where: { id_proveedor_precio: { in: toRemove } },
    }),
    ...toAdd.map((targetId) =>
      prisma.proveedorPrecios.create({
        data: {
          id_proveedor: id,
          id_servicio: isServicio ? targetId : null,
          id_material: !isServicio ? targetId : null,
          precio: 0,
        },
      })
    ),
  ];

  await prisma.$transaction(operations);
}
