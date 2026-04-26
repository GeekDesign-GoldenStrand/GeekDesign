import type { Servicios } from "@prisma/client";

import { prisma } from "@/lib/db/client";
import type { CreateServicioInput, UpdateServicioInput } from "@/lib/schemas/servicios";
import { NotFoundError } from "@/lib/utils/errors";

export async function listServicios(
  page: number,
  pageSize: number,
  soloActivos = false,
  query?: string
): Promise<{ items: Servicios[]; total: number }> {
  const where = {
    ...(soloActivos && { estatus_servicio: true }),
    ...(query && {
      OR: [
        { nombre_servicio: { contains: query, mode: "insensitive" as const } },
        { descripcion_servicio: { contains: query, mode: "insensitive" as const } },
      ],
    }),
  };
  const [items, total] = await Promise.all([
    prisma.servicios.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { id_servicio: "asc" },
    }),
    prisma.servicios.count({ where }),
  ]);
  return { items, total };
}

export async function getServicio(id: number): Promise<Servicios> {
  const servicio = await prisma.servicios.findUnique({ where: { id_servicio: id } });
  if (!servicio) throw new NotFoundError(`Servicio ${id} not found`);
  return servicio;
}

export async function getServicioWithDetails(id: number) {
  const servicio = await prisma.servicios.findFirst({
    where: { id_servicio: id, estatus_servicio: true },
    include: {
      opciones: {
        include: {
          material: true,
          valores: {
            orderBy: { es_default: "desc" },
            include: {
              matriz: { orderBy: { precio_unitario: "asc" } },
            },
          },
        },
      },
    },
  });
  if (!servicio) throw new NotFoundError(`Servicio ${id} no encontrado`);

  const allPrices = servicio.opciones.flatMap((o) =>
    o.valores.flatMap((v) => v.matriz.map((m) => Number(m.precio_unitario)))
  );
  const precioBase = allPrices.length > 0 ? Math.min(...allPrices) : null;

  return { servicio, precioBase };
}

export async function createServicio(data: CreateServicioInput): Promise<Servicios> {
  // TODO: implement
  void data;
  throw new Error("Not implemented");
}

export async function updateServicio(id: number, data: UpdateServicioInput): Promise<Servicios> {
  // TODO: implement — throw NotFoundError on Prisma P2025
  void id;
  void data;
  throw new Error("Not implemented");
}

export async function deleteServicio(id: number): Promise<void> {
  // TODO: implement
  void id;
  throw new Error("Not implemented");
}
