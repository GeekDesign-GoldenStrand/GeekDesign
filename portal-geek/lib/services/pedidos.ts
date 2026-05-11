import type { Pedidos, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/client";
import type { CreatePedidoInput, UpdatePedidoInput } from "@/lib/schemas/pedidos";
import { NotFoundError } from "@/lib/utils/errors";

export type PedidoDetail = Prisma.PedidosGetPayload<{
  include: {
    cliente: true;
    estatus: true;
    sucursal: true;
    detalles: {
      include: {
        servicio: { select: { nombre_servicio: true } };
        material: { select: { nombre_material: true } };
        archivo: { select: { url_archivo: true; nombre_archivo: true } };
      };
    };
    pagos: true;
    historial: {
      include: {
        estadoAnterior: { select: { descripcion: true } };
        estadoNuevo: { select: { descripcion: true } };
        usuario: { select: { nombre_completo: true } };
      };
    };
  };
}>;

export async function listPedidos(
  page: number,
  pageSize: number,
  serviceId?: number,
  onlyActive?: boolean
): Promise<{ items: Pedidos[]; total: number }> {
  const skip = (page - 1) * pageSize;

  // Build dynamic filter conditions
  const where: Prisma.PedidosWhereInput = {};
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
      include: {
        // include related entities for richer response
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
}

export async function getPedido(id: number): Promise<PedidoDetail> {
  const pedido = await prisma.pedidos.findUnique({
    where: { id_pedido: id },
    include: {
      cliente: true,
      estatus: true,
      sucursal: true,
      detalles: {
        include: {
          servicio: { select: { nombre_servicio: true } },
          material: { select: { nombre_material: true } },
          archivo: { select: { url_archivo: true, nombre_archivo: true } },
        },
      },
      pagos: { orderBy: { fecha: "asc" } },
      historial: {
        include: {
          estadoAnterior: { select: { descripcion: true } },
          estadoNuevo: { select: { descripcion: true } },
          usuario: { select: { nombre_completo: true } },
        },
        orderBy: { fecha_cambio: "asc" },
      },
    },
  });
  if (!pedido) throw new NotFoundError(`Pedido ${id} no encontrado`);
  return pedido;
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
