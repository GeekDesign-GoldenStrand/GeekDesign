import type { Instaladores } from "@prisma/client";

import { prisma } from "@/lib/db/client";
import type { CreateInstaladorInput, UpdateInstaladorInput } from "@/lib/schemas/instaladores";
import { NotFoundError } from "@/lib/utils/errors";

export async function listInstaladores(
  page: number,
  pageSize: number
): Promise<{ items: Instaladores[]; total: number }> {
  const [items, total] = await prisma.$transaction([
    prisma.instaladores.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { nombre_proveedor: "asc" },
    }),
    prisma.instaladores.count(),
  ]);
  return { items, total };
}

export async function getInstalador(id: number): Promise<Instaladores> {
  const instalador = await prisma.instaladores.findUnique({ where: { id_instalador: id } });
  if (!instalador) throw new NotFoundError(`Instalador ${id} no encontrado`);
  return instalador;
}

export async function createInstalador(data: CreateInstaladorInput): Promise<Instaladores> {
  return prisma.instaladores.create({ data });
}

export async function updateInstalador(
  id: number,
  data: UpdateInstaladorInput
): Promise<Instaladores> {
  try {
    return await prisma.instaladores.update({ where: { id_instalador: id }, data });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2025") {
      throw new NotFoundError(`Instalador ${id} no encontrado`);
    }
    throw err;
  }
}

export async function deleteInstalador(id: number): Promise<void> {
  try {
    await prisma.instaladores.delete({ where: { id_instalador: id } });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2025") {
      throw new NotFoundError(`Instalador ${id} no encontrado`);
    }
    throw err;
  }
}

// Additional helper to the list dropdown in order to not show unactive instaladores.


export async function getInstaladoresOptions(): Promise<
  Array<{
    id_instalador: number;
    nombre_proveedor: string;
    apodo: string | null;
    costo_instalacion: string;
  }>
> {
  const instaladores = await prisma.instaladores.findMany({
    where: { estatus: "Activo" },
    select: {
      id_instalador: true,
      nombre_proveedor: true,
      apodo: true,
      costo_instalacion: true,
    },
    orderBy: { costo_instalacion: "asc" },
  });

  // Prisma returns Decimal as a Decimal object; serialize to string for the client component.
  return instaladores.map((i) => ({
    ...i,
    costo_instalacion: i.costo_instalacion.toString(),
  }));
}