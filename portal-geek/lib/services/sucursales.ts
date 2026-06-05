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

// Sentinel status used only by `deleteSucursal` — distinct from "Inactivo" so
// users can still flip a branch to inactive without it disappearing from the
// table. The user-facing status toggle is locked to "Activo" / "Inactivo" by
// the zod schema, so this value can only be written via deleteSucursal.
const ESTATUS_ELIMINADA = "Eliminada";

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

  // Soft-deleted branches are never returned by the listing. Their estatus
  // sentinel is set by deleteSucursal and is unreachable from the UI.
  const where: Prisma.SucursalesWhereInput = {
    NOT: { estatus: ESTATUS_ELIMINADA },
  };

  // Conditions are collected dynamically so optional filters can be combined safely.
  const andConditions: Prisma.SucursalesWhereInput[] = [];

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
      include: {
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
    // Soft delete keeps historical relations (pedidos / colaboradores / maquinas
    // referencing this sucursal) intact. listSucursales filters this status out.
    await prisma.sucursales.update({
      where: {
        id_sucursal: id,
      },
      data: {
        estatus: ESTATUS_ELIMINADA,
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
