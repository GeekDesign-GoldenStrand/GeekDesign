import type { Pagos } from "@prisma/client";

import { prisma } from "@/lib/db/client";
import type { CreatePagoInput, UpdatePagoInput } from "@/lib/schemas/pagos";

export async function listPagosByPedido(
  idPedido: number,
  page: number,
  pageSize: number
): Promise<{ items: Pagos[]; total: number }> {
  // TODO: implement — filter by id_pedido
  void prisma;
  void idPedido;
  void page;
  void pageSize;
  throw new Error("Not implemented");
}

export async function getPago(id: number): Promise<Pagos> {
  // TODO: implement — throw new NotFoundError(...) if not found
  void id;
  throw new Error("Not implemented");
}

export async function createPago(data: CreatePagoInput): Promise<Pagos> {
  // TODO: implement
  void data;
  throw new Error("Not implemented");
}

export async function updatePago(id: number, data: UpdatePagoInput): Promise<Pagos> {
  // TODO: implement — throw NotFoundError on Prisma P2025
  void id;
  void data;
  throw new Error("Not implemented");
}
