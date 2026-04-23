import type { Pedidos } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import type { CreatePedidoInput, UpdatePedidoInput } from "@/lib/schemas/pedidos";

export async function listPedidos(
  page: number,
  pageSize: number,
  serviceId?: number,
  onlyActive?: boolean
): Promise<{ items: Pedidos[]; total: number }> {
  try {
    const skip = (page - 1) * pageSize;

    // Build dynamic filter conditions
    const where: any = {};
    if (serviceId) {
      // Include only orders that have at least one detail with the given serviceId
      where.detalles = { some: { id_servicio: serviceId } };
    }
    if (onlyActive) {
      // Exclude orders whose status is "Entregado" or "Cancelado"
      where.estatus = {
        descripcion: { notIn: ["Entregado", "Cancelado"] },
      };
    }

    // Execute two queries in parallel:
    // 1. Fetch the paginated list of orders with relations
    // 2. Count the total number of matching orders (for pagination metadata)
    const [items, total] = await Promise.all([
      prisma.pedidos.findMany({
        where, // apply filters
        skip,
        take: pageSize,
        include: { // include related entities for richer response
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
        orderBy: { fecha_creacion: "desc" },
      }),
      prisma.pedidos.count({ where }),
    ]);

    return { items, total };
  } catch (error) {
    console.error("Error fetching pedidos:", error);
    throw error;
  }
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