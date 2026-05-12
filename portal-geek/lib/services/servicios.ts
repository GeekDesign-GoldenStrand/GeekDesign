import type { Servicios } from "@prisma/client";

import { prisma } from "@/lib/db/client";
import type { CreateServicioInput, UpdateServicioInput } from "@/lib/schemas/servicios";
import { ConflictError, NotFoundError } from "@/lib/utils/errors";
import { Prisma } from "@prisma/client";


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
      orderBy: { nombre_servicio: "asc" },
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


/*
Created the function deleteServicio eith the objective of performing a soft delete on the servicio, 
changing its status to inactive. Before doing so, it checks if there are any 
active orders referencing the servicio. If there are, it throws a ConflictError with a message
indicating how many active orders are referencing the servicio. If the servicio to be deleted is 
not found, it throws a NotFoundError.
*/
export async function deleteServicio(id: number): Promise<void> {
  const pedidosActivos = await prisma.detallePedido.count({
    where: {
      id_servicio: id,
      pedido: {
        estatus: {
          descripcion: { notIn: ["Entregado", "Facturado"] },
        },
      },
    },
  });

  if (pedidosActivos > 0) {
    throw new ConflictError(
      `No se puede eliminar: el servicio está referenciado en ${pedidosActivos} pedido(s) en proceso.`
    );
  }

  try {
    await prisma.servicios.update({
      where: { id_servicio: id },
      data: { estatus_servicio: false },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new NotFoundError(`Servicio con id ${id} no encontrado`);
    }
    throw error;
  }
}
