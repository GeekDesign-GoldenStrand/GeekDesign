import { Prisma } from "@prisma/client";
import type { Sucursales } from "@prisma/client";

import { prisma } from "@/lib/db/client";
import type { CreateSucursalInput, UpdateSucursalInput } from "@/lib/schemas/sucursales";
import { NotFoundError } from "@/lib/utils/errors";

// Detail view payload.
// Relations are included here because the branch edit screen also works as a summary
// of the orders, collaborators, and machines linked to that branch.
export type SucursalWithRelations = Prisma.SucursalesGetPayload<{
  include: {
    pedidos: true;
    colaboradores: {
      include: {
        usuario: true;
      };
    };
    maquinas: {
      include: {
        maquina: true;
      };
    };
  };
}>;

function handlePrismaNotFoundError(err: unknown): never {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
    throw new NotFoundError("Sucursal not found");
  }

  throw err;
}

export async function listSucursales(
  page: number,
  pageSize: number,
  filters?: {
    search?: string | null;
    nombre?: string | null;
    direccion?: string | null;
    estatus?: string[];
  }
): Promise<{ items: Sucursales[]; total: number }> {
  const skip = (page - 1) * pageSize;

  const where: Prisma.SucursalesWhereInput = {};

  // Conditions are collected dynamically so optional filters can be combined safely.
  const andConditions: Prisma.SucursalesWhereInput[] = [];

  // Branch deletion is implemented as a soft delete.
  // By default, the table only shows active branches unless a status filter is provided.
  if (!filters?.estatus || filters.estatus.length === 0) {
    andConditions.push({
      estatus: "Activo",
    });
  }

  if (filters?.search) {
    andConditions.push({
      OR: [
        {
          nombre_sucursal: {
            contains: filters.search,
            mode: "insensitive",
          },
        },
        {
          direccion: {
            contains: filters.search,
            mode: "insensitive",
          },
        },
      ],
    });
  }

  if (filters?.nombre) {
    andConditions.push({
      nombre_sucursal: {
        contains: filters.nombre,
        mode: "insensitive",
      },
    });
  }

  if (filters?.direccion) {
    andConditions.push({
      direccion: {
        contains: filters.direccion,
        mode: "insensitive",
      },
    });
  }

  // Explicit status filters override the default active-only behavior.
  // This allows users to search inactive branches when needed.
  if (filters?.estatus && filters.estatus.length > 0) {
    andConditions.push({
      estatus: {
        in: filters.estatus,
      },
    });
  }

  if (andConditions.length > 0) {
    where.AND = andConditions;
  }

  // Run the list and count queries in the same transaction.
  // This prevents pagination inconsistencies if another write happens between both reads.
  const [items, total] = await prisma.$transaction([
    prisma.sucursales.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: {
        id_sucursal: "asc",
      },
    }),
    prisma.sucursales.count({ where }),
  ]);

  return { items, total };
}

export async function getSucursal(id: number): Promise<SucursalWithRelations> {
  const sucursal = await prisma.sucursales.findUnique({
    where: {
      id_sucursal: id,
    },
    include: {
      pedidos: true,
      colaboradores: {
        include: {
          usuario: true,
        },
      },
      maquinas: {
        include: {
          maquina: true,
        },
      },
    },
  });

  if (!sucursal) {
    throw new NotFoundError("Sucursal not found");
  }

  return sucursal;
}

export async function createSucursal(data: CreateSucursalInput): Promise<Sucursales> {
  return prisma.sucursales.create({
    data: {
      nombre_sucursal: data.nombre_sucursal,
      direccion: data.direccion,
      horario_apertura: data.horario_apertura ?? null,
      horario_salida: data.horario_salida ?? null,
      estatus: data.estatus,
    },
  });
}

export async function updateSucursal(id: number, data: UpdateSucursalInput): Promise<Sucursales> {
  try {
    return await prisma.sucursales.update({
      where: {
        id_sucursal: id,
      },
      data: {
        nombre_sucursal: data.nombre_sucursal,
        direccion: data.direccion,
        horario_apertura: data.horario_apertura,
        horario_salida: data.horario_salida,
        estatus: data.estatus,
      },
    });
  } catch (err) {
    handlePrismaNotFoundError(err);
  }
}

export async function deleteSucursal(id: number): Promise<void> {
  try {
    // Soft delete keeps historical relations intact.
    // The branch disappears from the default table because listSucursales filters active records.
    await prisma.sucursales.update({
      where: {
        id_sucursal: id,
      },
      data: {
        estatus: "Inactivo",
      },
    });
  } catch (err) {
    handlePrismaNotFoundError(err);
  }
}

// Additional helper to the list dropdown in order to not show unactive sucursales.
export async function getSucursalesOptions(): Promise<
  Array<{ id_sucursal: number; nombre_sucursal: string }>
> {
  return prisma.sucursales.findMany({
    where: { estatus: "Activo" },
    select: { id_sucursal: true, nombre_sucursal: true },
    orderBy: { nombre_sucursal: "asc" },
  });
}
