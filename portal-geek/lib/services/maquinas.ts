import type { Maquinas } from "@prisma/client";

import { prisma } from "@/lib/db/client";
import type { CreateMaquinaInput, UpdateMaquinaInput } from "@/lib/schemas/maquinas";
import { NotFoundError } from "@/lib/utils/errors";

export async function listMaquinas(
  page: number,
  pageSize: number
): Promise<{ items: Maquinas[]; total: number }> {
  const [items, total] = await prisma.$transaction([
    prisma.maquinas.findMany({
      where: {
        estatus: { not: "Inactiva" },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { fecha_registro: "asc" },
      include: {
        sucursales: {
          include: {
            sucursal: true,
          },
        },
        servicios: {
          include: {
            servicio: true,
          },
        },
      },
    }),
    prisma.maquinas.count({
      where: {
        estatus: { not: "Inactiva" },
      },
    }),
  ]);
  return { items, total };
}

export async function getMaquina(id: number): Promise<Maquinas> {
  void id;
  throw new Error("Not implemented");
}

export async function createMaquina(data: CreateMaquinaInput): Promise<Maquinas> {
  return prisma.maquinas.create({
    data: {
      nombre_maquina: data.nombre_maquina,
      apodo_maquina: data.apodo_maquina,
      tipo: data.tipo,
      descripcion: data.descripcion || null,
      estatus: "Activa",
    },
    include: {
      sucursales: {
        include: {
          sucursal: true,
        },
      },
      servicios: {
        include: {
          servicio: true,
        },
      },
    },
  });
}

export async function updateMaquina(id: number, data: UpdateMaquinaInput): Promise<Maquinas> {
  try {
    return await prisma.maquinas.update({
      where: { id_maquina: id },
      data: data,
      include: {
        sucursales: {
          include: { sucursal: true },
        },
        servicios: {
          include: { servicio: true },
        },
      },
    });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2025") {
      throw new NotFoundError(`Máquina ${id} no encontrada`);
    }
    throw err;
  }
}

export async function deleteMaquina(id: number): Promise<void> {
  try {
    await prisma.maquinas.update({
      where: { id_maquina: id },
      data: { estatus: "Inactiva" },
    });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2025") {
      throw new NotFoundError(`Maquina ${id} no encontrada`);
    }
    throw err;
  }
}

export async function asignarSucursal(id: number, sucursal: number): Promise<Maquinas> {
  await prisma.sucursalesMaquina.upsert({
    where: { id_maquina: id },
    update: { id_sucursal: sucursal },
    create: { id_maquina: id, id_sucursal: sucursal },
  });

  const maquina = await prisma.maquinas.findUnique({
    where: { id_maquina: id },
    include: {
      sucursales: { include: { sucursal: true } },
      servicios: { include: { servicio: true } },
    },
  });

  if (!maquina) throw new NotFoundError(`Máquina ${id} no encontrada`);

  return maquina;
}

export async function asignarServicios(id: number, servicios: number[]): Promise<Maquinas> {
  await prisma.$transaction([
    prisma.serviciosMaquina.deleteMany({
      where: { id_maquina: id },
    }),
    prisma.serviciosMaquina.createMany({
      data: servicios.map((id_servicio) => ({
        id_maquina: id,
        id_servicio,
      })),
    }),
  ]);

  const maquina = await prisma.maquinas.findUnique({
    where: { id_maquina: id },
    include: {
      sucursales: { include: { sucursal: true } },
      servicios: { include: { servicio: true } },  // ← fixed
    },
  });

  if (!maquina) throw new NotFoundError(`Máquina ${id} no encontrada`);

  return maquina;
}

// Returns all active machines for dropdowns,
// After the admin choses a branch in the service form, we need
// to show only the machines linked to that branch and that are active.

export async function getMaquinasOptionsBySucursal(idSucursal: number): Promise<
  Array<{
    id_maquina: number;
    nombre_maquina: string;
    apodo_maquina: string;
    tipo: string;
  }>
> {
  const rows = await prisma.sucursalesMaquina.findMany({
    where: {
      id_sucursal: idSucursal,
      maquina: { estatus: "Activa" },
    },
    select: {
      maquina: {
        select: {
          id_maquina: true,
          nombre_maquina: true,
          apodo_maquina: true,
          tipo: true,
        },
      },
    },
    orderBy: { maquina: { apodo_maquina: "asc" } },
  });

  // Flatten the nested shape from the pivot.
  return rows.map((r) => r.maquina);
}
