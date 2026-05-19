import type { Proveedores } from "@prisma/client";

import { prisma } from "@/lib/db/client";
import type { CreateProveedorInput, UpdateProveedorInput } from "@/lib/schemas/proveedores";
import { NotFoundError, ValidationError } from "@/lib/utils/errors";

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

export async function getProviderAssignments(id: number) {
  await getProveedor(id);
  const assignments = await prisma.proveedorPrecios.findMany({
    where: { id_proveedor: id },
    select: { id_servicio: true, id_material: true, precio: true, notas: true },
  });

  const servicePrices: Record<number, number> = {};
  const serviceNotes: Record<number, string> = {};
  const materialPrices: Record<number, number> = {};
  const materialNotes: Record<number, string> = {};

  for (const a of assignments) {
    if (a.id_servicio !== null) {
      servicePrices[a.id_servicio] = Number(a.precio ?? 0);
      serviceNotes[a.id_servicio] = a.notas ?? "";
    } else if (a.id_material !== null) {
      materialPrices[a.id_material] = Number(a.precio ?? 0);
      materialNotes[a.id_material] = a.notas ?? "";
    }
  }

  return {
    serviceIds: assignments.map((a) => a.id_servicio).filter((id): id is number => id !== null),
    materialIds: assignments.map((a) => a.id_material).filter((id): id is number => id !== null),
    servicePrices,
    serviceNotes,
    materialPrices,
    materialNotes,
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

  if (items.length > 0) {
    const ids = items.map((i) => i.id);
    if (isServicio) {
      const valid = await prisma.servicios.findMany({
        where: { id_servicio: { in: ids }, estatus_servicio: true },
        select: { id_servicio: true },
      });
      if (valid.length !== ids.length) {
        const validSet = new Set(valid.map((s) => s.id_servicio));
        const bad = ids.filter((id) => !validSet.has(id));
        throw new ValidationError(`Servicios no válidos o inactivos: ${bad.join(", ")}`);
      }
    } else {
      const valid = await prisma.materiales.findMany({
        where: { id_material: { in: ids } },
        select: { id_material: true },
      });
      if (valid.length !== ids.length) {
        const validSet = new Set(valid.map((m) => m.id_material));
        const bad = ids.filter((id) => !validSet.has(id));
        throw new ValidationError(`Materiales no encontrados: ${bad.join(", ")}`);
      }
    }
  }

  await prisma.$transaction(async (tx) => {
    const existing = await tx.proveedorPrecios.findMany({
      where: {
        id_proveedor: id,
        id_servicio: isServicio ? { not: null } : undefined,
        id_material: !isServicio ? { not: null } : undefined,
      },
      select: { id_proveedor_precio: true, id_servicio: true, id_material: true },
    });

    const incomingIdSet = new Set(items.map((i) => i.id));
    const priceMap = new Map(items.map((i) => [i.id, i.precio]));
    const notesMap = new Map(items.map((i) => [i.id, i.notas ?? ""]));

    const candidatePkIds = existing
      .filter((e) => {
        const cid = isServicio ? e.id_servicio : e.id_material;
        return cid !== null && !incomingIdSet.has(cid);
      })
      .map((e) => e.id_proveedor_precio);

    // Skip rows referenced by Gastos — deleting them would break cost history
    let toDeletePkIds: number[] = candidatePkIds;
    if (candidatePkIds.length > 0) {
      const referenced = await tx.gastos.findMany({
        where: { id_proveedor_precio: { in: candidatePkIds } },
        select: { id_proveedor_precio: true },
      });
      const referencedSet = new Set(referenced.map((g) => g.id_proveedor_precio));
      toDeletePkIds = candidatePkIds.filter((pk) => !referencedSet.has(pk));
    }

    const existingIdSet = new Set(
      existing
        .map((e) => (isServicio ? e.id_servicio : e.id_material))
        .filter((v): v is number => v !== null)
    );

    const toAdd = items.filter((item) => !existingIdSet.has(item.id));
    const toUpdate = existing.filter((e) => {
      const cid = isServicio ? e.id_servicio : e.id_material;
      return cid !== null && incomingIdSet.has(cid);
    });

    if (toDeletePkIds.length > 0) {
      await tx.proveedorPrecios.deleteMany({
        where: { id_proveedor_precio: { in: toDeletePkIds } },
      });
    }

    if (toAdd.length > 0) {
      await tx.proveedorPrecios.createMany({
        data: toAdd.map((item) => ({
          id_proveedor: id,
          id_servicio: isServicio ? item.id : null,
          id_material: !isServicio ? item.id : null,
          precio: item.precio,
          notas: item.notas ?? "",
        })),
        skipDuplicates: true,
      });
    }

    for (const row of toUpdate) {
      const cid = (isServicio ? row.id_servicio : row.id_material) as number;
      await tx.proveedorPrecios.update({
        where: { id_proveedor_precio: row.id_proveedor_precio },
        data: {
          precio: priceMap.get(cid)!,
          notas: notesMap.get(cid) ?? "",
        },
      });
    }
  });
}
