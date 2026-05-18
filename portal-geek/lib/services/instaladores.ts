import type { Instaladores } from "@prisma/client";

import { prisma } from "@/lib/db/client";
import type { CreateInstaladorInput, UpdateInstaladorInput } from "@/lib/schemas/instaladores";
import { NotFoundError } from "@/lib/utils/errors";

export async function listInstaladores(
  page: number,
  pageSize: number
): Promise<{ items: Instaladores[]; total: number }> {
  const where = { estatus: { not: "Inactivo" } };
  const [items, total] = await prisma.$transaction([
    prisma.instaladores.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { nombre_instalador: "asc" },
    }),
    prisma.instaladores.count({ where }),
  ]);
  return { items, total };
}

export async function getInstalador(id: number): Promise<Instaladores> {
  const instalador = await prisma.instaladores.findUnique({ where: { id_instalador: id } });
  if (!instalador) throw new NotFoundError(`Instalador ${id} no encontrado`);
  return instalador;
}

export async function createInstalador(data: CreateInstaladorInput): Promise<Instaladores> {
  return prisma.instaladores.create({
    data: {
      nombre_instalador: data.nombre_instalador,
      apodo: data.apodo || null,
      tipo: data.tipo,
      telefono: data.telefono,
      correo: data.correo,
      costo_instalacion: data.costo_instalacion,
      notas: data.notas || null,
      ubicacion: data.ubicacion || null,
      estatus: data.estatus,
    },
  });
}

export async function updateInstalador(
  id: number,
  data: UpdateInstaladorInput
): Promise<Instaladores> {
  try {
    return await prisma.instaladores.update({ where: { id_instalador: id }, data: data });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2025") {
      throw new NotFoundError(`Instalador ${id} no encontrado`);
    }
    throw err;
  }
}

export async function deleteInstalador(id: number): Promise<void> {
  try {
    await prisma.instaladores.update({
      where: { id_instalador: id },
      data: { estatus: "Inactivo" },
    });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2025") {
      throw new NotFoundError(`Instalador ${id} no encontrado`);
    }
    throw err;
  }
}

export async function getInstaladoresOptions(): Promise<
  Array<{
    id_instalador: number;
    nombre_instalador: string;
    apodo: string | null;
    costo_instalacion: string;
  }>
> {
  const instaladores = await prisma.instaladores.findMany({
    where: { estatus: "Activo" },
    select: {
      id_instalador: true,
      nombre_instalador: true,
      apodo: true,
      costo_instalacion: true,
    },
    orderBy: { costo_instalacion: "asc" },
  });

  return instaladores.map((i) => ({
    ...i,
    costo_instalacion: i.costo_instalacion.toString(),
  }));
}

export async function getInstaladorAssignments(id: number) {
  await getInstalador(id);
  const assignments = await prisma.instaladorServicios.findMany({
    where: { id_instalador: id },
    select: { id_servicio: true, costo: true, notas: true },
  });

  return {
    items: assignments.map((a) => ({
      id: a.id_servicio,
      precio: a.costo,
      ...(a.notas != null && { notas: a.notas }),
    })),
  };
}

export async function syncInstaladorAssignments(
  id: number,
  items: Array<{ id: number; precio: number; notas?: string }>
) {
  const deduped = Array.from(new Map(items.map((i) => [i.id, i])).values());
  await getInstalador(id);

  await prisma.$transaction(async (tx) => {
    const existing = await tx.instaladorServicios.findMany({
      where: { id_instalador: id },
      select: { id_instalador_servicio: true, id_servicio: true },
    });

    const existingMap = new Map(existing.map((e) => [e.id_servicio, e.id_instalador_servicio]));
    const newMap = new Map(deduped.map((i) => [i.id, i]));

    const candidatePkIds = existing
      .filter((e) => !newMap.has(e.id_servicio))
      .map((e) => e.id_instalador_servicio);

    // Skip assignments referenced by Gastos — deleting them would break cost history
    let toDeletePkIds: number[] = candidatePkIds;
    if (candidatePkIds.length > 0) {
      const referenced = await tx.gastos.findMany({
        where: { id_instalador_servicio: { in: candidatePkIds } },
        select: { id_instalador_servicio: true },
      });
      const referencedSet = new Set(referenced.map((g) => g.id_instalador_servicio));
      toDeletePkIds = candidatePkIds.filter((pk) => !referencedSet.has(pk));
    }

    const toAdd = deduped.filter((i) => !existingMap.has(i.id));
    const toUpdate = deduped.filter((i) => existingMap.has(i.id));

    if (toDeletePkIds.length > 0) {
      await tx.instaladorServicios.deleteMany({
        where: { id_instalador_servicio: { in: toDeletePkIds } },
      });
    }

    if (toAdd.length > 0) {
      await tx.instaladorServicios.createMany({
        data: toAdd.map((i) => ({
          id_instalador: id,
          id_servicio: i.id,
          costo: i.precio,
          notas: i.notas ?? null,
        })),
        skipDuplicates: true,
      });
    }

    await Promise.all(
      toUpdate.map((i) =>
        tx.instaladorServicios.update({
          where: { id_instalador_servicio: existingMap.get(i.id)! },
          data: { costo: i.precio, notas: i.notas ?? null },
        })
      )
    );
  });
}
