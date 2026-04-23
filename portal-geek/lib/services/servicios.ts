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
  if (!servicio) throw new NotFoundError(`Servicio ${id} no encontrado`);
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

/*
Create a new service with the provided data. Returns the created service. Throws AppError on validation failure or other issues.
*/
export async function createServicio(
  data: CreateServicioInput
): Promise<Servicios> {
  const { id_maquinas, id_instaladores, id_proveedores, ...servicioData } = data;

  return prisma.$transaction(async (tx) => {
    const servicio = await tx.servicios.create({ data: servicioData });

    if (id_maquinas && id_maquinas.length > 0) {
      await tx.servicioMaquina.createMany({
        data: id_maquinas.map((id_maquina) => ({
          id_servicio: servicio.id_servicio,
          id_maquina,
        })),
      });
    }

    if (id_instaladores && id_instaladores.length > 0) {
      await tx.instaladorServicios.createMany({
        data: id_instaladores.map((id_instalador) => ({
          id_servicio: servicio.id_servicio,
          id_instalador,
        })),
      });
    }

    if (id_proveedores && id_proveedores.length > 0) {
      await tx.servicioProveedor.createMany({
        data: id_proveedores.map((id_proveedor) => ({
          id_servicio: servicio.id_servicio,
          id_proveedor,
        })),
      });
    }

    return servicio;
  });
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
