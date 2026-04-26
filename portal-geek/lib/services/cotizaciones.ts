import type { Cotizaciones } from "@prisma/client";

import { prisma } from "@/lib/db/client";
import type { CreateCotizacionInput, UpdateCotizacionInput } from "@/lib/schemas/cotizaciones";

export async function listCotizaciones(
  page: number,
  pageSize: number
): Promise<{ items: Cotizaciones[]; total: number }> {
  // TODO: implement — consider including cliente and estatus relations
  void prisma;
  void page;
  void pageSize;
  throw new Error("Not implemented");
}

export async function getCotizacion(id: number): Promise<Cotizaciones> {
  const cotizacion = await prisma.cotizaciones.findUnique({
    where: { id_cotizacion: id },               // ← adjust PK field name
  });

  if (!cotizacion) {
    throw new Error(`Cotización con id ${id} no encontrada`);
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
