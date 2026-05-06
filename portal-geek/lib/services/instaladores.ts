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
      orderBy: { nombre_instalador: "asc" },
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
  return prisma.instaladores.create({
    data: {
      nombre_instalador: data.nombre_instalador,
      apodo: data.apodo || null,
      tipo: data.tipo,
      telefono: data.telefono,
      correo: data.correo,
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
