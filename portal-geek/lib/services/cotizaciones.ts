import type { Cotizaciones } from "@prisma/client";
import { NotFoundError } from "@/lib/utils/errors";

import { prisma } from "@/lib/db/client";
import type { CreateCotizacionInput, UpdateCotizacionInput } from "@/lib/schemas/cotizaciones";

export async function listCotizaciones(
  page: number,
  pageSize: number
): Promise<{ items: Cotizaciones[]; total: number }> {
  const [items, total] = await prisma.$transaction([
    prisma.cotizaciones.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { fecha_creacion: "desc" },
    }),
    prisma.cotizaciones.count(),
  ]);
  return { items, total };
}

export async function getCotizacion(id: number): Promise<Cotizaciones> {
  const cotizacion = await prisma.cotizaciones.findUnique({
    where: { id_cotizacion: id },
  });

  if (!cotizacion) {
    throw new NotFoundError(`Cotización con id ${id} no encontrada`);
  }

  return cotizacion;
}

export async function createCotizacion(data: CreateCotizacionInput): Promise<Cotizaciones> {
  // TODO: implement
  void data;
  throw new Error("Not implemented");
}

export async function updateCotizacion(
  id: number,
  data: UpdateCotizacionInput
): Promise<Cotizaciones> {
  // TODO: implement — throw NotFoundError on Prisma P2025
  // Also log HistorialEstadosCotizacion when id_estatus_cotizacion changes
  void id;
  void data;
  throw new Error("Not implemented");
}

export async function deleteCotizacion(id: number): Promise<void> {
  // TODO: implement
  void id;
  throw new Error("Not implemented");
}

export async function getQuotationStatusId(description: string) {
  const status = await prisma.estatusCotizacion.findUnique({
    where: { descripcion: description },
  });
  if (!status) {
    throw new Error(`Estatus de cotización '${description}' no encontrado`);
  }
  return status.id_estatus;
}
