import type { Pedidos } from "@prisma/client";

import { prisma } from "@/lib/db/client";
import type { CreatePedidoInput, UpdatePedidoInput } from "@/lib/schemas/pedidos";

export async function listPedidos(
  page: number,
  pageSize: number
): Promise<{ items: Pedidos[]; total: number }> {
  // TODO: implement — consider including cliente and estatus relations
  void prisma;
  void page;
  void pageSize;
  throw new Error("Not implemented");
}

export async function getPedido(id: number): Promise<Pedidos> {
  // TODO: implement — throw new NotFoundError(...) if not found
  void id;
  throw new Error("Not implemented");
}

export async function createPedido(data: CreatePedidoInput): Promise<Pedidos> {
  // TODO: implement
  void data;
  throw new Error("Not implemented");
}

export async function updatePedido(id: number, data: UpdatePedidoInput): Promise<Pedidos> {
  // TODO: implement — throw NotFoundError on Prisma P2025
  // Also log HistorialEstadosPedidos when id_estatus changes
  void id;
  void data;
  throw new Error("Not implemented");
}

export async function deletePedido(id: number): Promise<void> {
  // TODO: implement
  void id;
  throw new Error("Not implemented");
}
