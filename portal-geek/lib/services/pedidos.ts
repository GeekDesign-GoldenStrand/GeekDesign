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

/* Lo de acá abajo es lo que antes era lib/services/orders.ts, pero cambió con lo que hay arriba que venía en la rama develop
import { prisma } from "@/lib/db/client";

/**
 * Get orders with optional filters:
 * - onlyActive: filter by active status
 * - serviceId: filter by service
 */
/*
export async function getOrders(options?: { onlyActive?: boolean; serviceId?: number }) {
  // Extract values from options, set default for onlyActive = false
  const { onlyActive = false, serviceId } = options || {};


  return prisma.pedidos.findMany({
    where: {
      // If onlyActive is true, exclude orders with status "Entregado" or "Cancelado"
      ...(onlyActive && {
        estatus: {
          descripcion: {
            notIn: ["Entregado", "Cancelado"],
          },
        },
      }),
      // If serviceId is provided, filter orders that have at least one detail with that service
      ...(serviceId && {
        detalles: {
          some: {
            id_servicio: serviceId,
          },
        },
      }),
    },
    include: {
      // Include related data for richer response
      cliente: true,
      sucursal: true,
      estatus: true,
      detalles: {
        include: {
          servicio: true,
          material: true,
          archivo: true,
        },
      },
    },
  });
}

*/