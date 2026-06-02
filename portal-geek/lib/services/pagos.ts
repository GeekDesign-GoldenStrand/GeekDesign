import type { Pagos } from "@prisma/client";

import { prisma } from "@/lib/db/client";
import type { CreatePagoInput, UpdatePagoInput } from "@/lib/schemas/pagos";
import { NotImplementedError } from "@/lib/utils/errors";

// Feature still in construction — service stubs return safe empty values on
// reads and surface a NotImplementedError (503) on writes, so the API doesn't
// leak a stack trace and the UI can render an "En construcción" placeholder.

export async function listPagosByPedido(
  idPedido: number,
  page: number,
  pageSize: number
): Promise<{ items: Pagos[]; total: number }> {
  void prisma;
  void idPedido;
  void page;
  void pageSize;
  return { items: [], total: 0 };
}

export async function getPago(id: number): Promise<Pagos> {
  void id;
  throw new NotImplementedError("La consulta de pagos aún no está disponible");
}

export async function createPago(data: CreatePagoInput): Promise<Pagos> {
  void data;
  throw new NotImplementedError("El registro de pagos aún no está disponible");
}

export async function updatePago(id: number, data: UpdatePagoInput): Promise<Pagos> {
  void id;
  void data;
  throw new NotImplementedError("La actualización de pagos aún no está disponible");
}
