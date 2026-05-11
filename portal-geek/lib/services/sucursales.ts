import type { Sucursales } from "@prisma/client";

import { prisma } from "@/lib/db/client";
import type { CreateSucursalInput, UpdateSucursalInput } from "@/lib/schemas/sucursales";

export type SucursalWithRelations = Sucursales;

type ListSucursalesFilters = {
  search?: string;
  nombre?: string;
  direccion?: string;
  estatus?: string[];
};

export async function listSucursales(
  page: number,
  pageSize: number,
  filters?: ListSucursalesFilters
) {
  const skip = (page - 1) * pageSize;

  const where = {
    AND: [
      filters?.search
        ? {
            OR: [
              {
                nombre_sucursal: {
                  contains: filters.search,
                  mode: "insensitive" as const,
                },
              },
              {
                direccion: {
                  contains: filters.search,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {},

      filters?.nombre
        ? {
            nombre_sucursal: {
              contains: filters.nombre,
            },
          }
        : {},

      filters?.direccion
        ? {
            direccion: {
              contains: filters.direccion,
            },
          }
        : {},

      filters?.estatus?.length
        ? {
            estatus: {
              in: filters.estatus,
            },
          }
        : {},
    ],
  };

  const [items, total] = await Promise.all([
    prisma.sucursales.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { id_sucursal: "asc" },
    }),

    prisma.sucursales.count({
      where,
    }),
  ]);

  return { items, total };
}

export async function getSucursal(id: number): Promise<Sucursales> {
  // TODO: implement — throw new NotFoundError(...) if not found
  void id;
  throw new Error("Not implemented");
}

export async function createSucursal(data: CreateSucursalInput): Promise<Sucursales> {
  // TODO: implement
  void data;
  throw new Error("Not implemented");
}

export async function updateSucursal(id: number, data: UpdateSucursalInput): Promise<Sucursales> {
  // TODO: implement — throw NotFoundError on Prisma P2025
  void id;
  void data;
  throw new Error("Not implemented");
}

export async function deleteSucursal(id: number): Promise<void> {
  // TODO: implement
  void id;
  throw new Error("Not implemented");
}
