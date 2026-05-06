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

export async function getProviderAssignments(id: number) {
  await getProveedor(id);
  const assignments = await prisma.proveedorPrecios.findMany({
    where: { id_proveedor: id },
    select: { id_servicio: true, id_material: true, precio: true, notas: true },
  });

  const prices: Record<number, number> = {};
  const notes: Record<number, string> = {};
  for (const a of assignments) {
    const itemId = a.id_servicio ?? a.id_material;
    if (itemId !== null) {
      prices[itemId] = Number(a.precio ?? 0);
      notes[itemId] = a.notas ?? "";
    }
  }

  return {
    serviceIds: assignments.map((a) => a.id_servicio).filter((id): id is number => id !== null),
    materialIds: assignments.map((a) => a.id_material).filter((id): id is number => id !== null),
    prices,
    notes,
  };
}

export async function syncProviderAssignments(
  id: number,
  type: "servicio" | "material",
  rawItems: { id: number; precio: number; notas?: string }[]
) {
  const seen = new Set<number>();
  const items = rawItems.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });

  await getProveedor(id);
  const isServicio = type === "servicio";

  const current = await prisma.proveedorPrecios.findMany({
    where: {
      id_proveedor: id,
      id_servicio: isServicio ? { not: null } : undefined,
      id_material: !isServicio ? { not: null } : undefined,
    },
  });

  const incomingIds = items.map((i) => i.id);
  const priceMap = new Map(items.map((i) => [i.id, i.precio]));
  const notesMap = new Map(items.map((i) => [i.id, i.notas ?? ""]));

  const toRemove = current
    .filter((c) => {
      const cid = isServicio ? c.id_servicio : c.id_material;
      return cid !== null && !incomingIds.includes(cid);
    })
    .map((c) => c.id_proveedor_precio);

  const currentIds = current
    .map((c) => (isServicio ? c.id_servicio : c.id_material))
    .filter((v): v is number => v !== null);

  const toAdd = items.filter((item) => !currentIds.includes(item.id));
  const toUpdate = current.filter((c) => {
    const cid = isServicio ? c.id_servicio : c.id_material;
    return cid !== null && incomingIds.includes(cid);
  });

  const operations = [
    prisma.proveedorPrecios.deleteMany({
      where: { id_proveedor_precio: { in: toRemove } },
    }),
    ...toAdd.map((item) =>
      prisma.proveedorPrecios.create({
        data: {
          id_proveedor: id,
          id_servicio: isServicio ? item.id : null,
          id_material: !isServicio ? item.id : null,
          precio: item.precio,
          notas: item.notas ?? "",
        },
      })
    ),
    ...toUpdate.map((row) => {
      const cid = (isServicio ? row.id_servicio : row.id_material) as number;
      return prisma.proveedorPrecios.update({
        where: { id_proveedor_precio: row.id_proveedor_precio },
        data: {
          precio: priceMap.get(cid) ?? row.precio,
          notas: notesMap.get(cid) ?? row.notas ?? "",
        },
      });
    }),
  ];

  await prisma.$transaction(operations);
}
