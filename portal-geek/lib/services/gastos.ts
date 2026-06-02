import type { Gastos } from "@prisma/client";

import { prisma } from "@/lib/db/client";
import type { CreateGastoInput, UpdateGastoInput } from "@/lib/schemas/gastos";
import { NotImplementedError } from "@/lib/utils/errors";

// Feature still in construction — reads return safe empty values and writes
// surface a NotImplementedError (503) so the API doesn't 500 on demo clicks.
// The /finanzas page already shows an EnConstruccion view; this just prevents
// stack traces if any other route happens to hit these endpoints.

export async function listGastosByPedido(
  idPedido: number,
  page: number,
  pageSize: number
): Promise<{ items: Gastos[]; total: number }> {
  void prisma;
  void idPedido;
  void page;
  void pageSize;
  return { items: [], total: 0 };
}

export async function getGasto(id: number): Promise<Gastos> {
  void id;
  throw new NotImplementedError("La consulta de gastos aún no está disponible");
}

export async function createGasto(data: CreateGastoInput): Promise<Gastos> {
  void data;
  throw new NotImplementedError("El registro de gastos aún no está disponible");
}

export async function updateGasto(id: number, data: UpdateGastoInput): Promise<Gastos> {
  void id;
  void data;
  throw new NotImplementedError("La actualización de gastos aún no está disponible");
}

export async function deleteGasto(id: number): Promise<void> {
  void id;
  throw new NotImplementedError("La eliminación de gastos aún no está disponible");
}
