import type { Gastos } from "@prisma/client";

import { prisma } from "@/lib/db/client";
import type { CreateGastoInput, UpdateGastoInput } from "@/lib/schemas/gastos";

export async function listGastosByPedido(
  idPedido: number,
  page: number,
  pageSize: number
): Promise<{ items: Gastos[]; total: number }> {
  // TODO: implement — filter by id_pedido
  void prisma;
  void idPedido;
  void page;
  void pageSize;
  throw new Error("Not implemented");
}

export async function getGasto(id: number): Promise<Gastos> {
  // TODO: implement — throw new NotFoundError(...) if not found
  void id;
  throw new Error("Not implemented");
}

export async function createGasto(data: CreateGastoInput): Promise<Gastos> {
  // TODO: implement
  void data;
  throw new Error("Not implemented");
}

export async function updateGasto(id: number, data: UpdateGastoInput): Promise<Gastos> {
  // TODO: implement — throw NotFoundError on Prisma P2025
  void id;
  void data;
  throw new Error("Not implemented");
}

export async function deleteGasto(id: number): Promise<void> {
  // TODO: implement
  void id;
  throw new Error("Not implemented");
}
