import type { Pedidos } from "@prisma/client";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/client";
import type { CreatePedidoInput, UpdatePedidoInput } from "@/lib/schemas/pedidos";

// Centralized catalog of order statuses.
// Using constants avoids scattered "magic strings" and makes refactoring safer.
export const PEDIDO_STATUS = {
  COTIZACION: "Cotizacion",
  PAGADO: "Pagado",
  EN_COLA: "En_cola",
  APROBACION_DISENO: "Aprobacion_diseno",
  EN_PRODUCCION: "En_produccion",
  ENTREGADO: "Entregado",
  FACTURADO: "Facturado",
} as const;

export type PedidoStatus = (typeof PEDIDO_STATUS)[keyof typeof PEDIDO_STATUS];

// Helper to resolve status IDs by description.
// Avoids "magic strings" and ensures filters remain valid if catalog descriptions change.
export async function getPedidoStatusIds(descriptions: string[]): Promise<number[]> {
  const statuses = await prisma.estatusPedidos.findMany({
    where: { descripcion: { in: descriptions } },
    select: { id_estatus: true },
  });

  if (statuses.length !== descriptions.length) {
    throw new Error("One or more pedido statuses not found in catalog");
  }

  return statuses.map((s) => s.id_estatus);
}

export async function listPedidos(
  page: number,
  pageSize: number,
  serviceIds: number[] = [],
  estatuses: string[] = [],
  onlyActive?: boolean,
  empresa?: string | null,
  cliente?: string | null,
  search?: string | null
): Promise<{ items: Pedidos[]; total: number }> {
  const skip = (page - 1) * pageSize;

  // Build dynamic filter conditions
  const where: Prisma.PedidosWhereInput = {};

  if (onlyActive) {
    // Resolve inactive status IDs once and filter by ID.
    const inactiveStatusIds = await getPedidoStatusIds(["Facturado"]);
    where.id_estatus = { notIn: inactiveStatusIds };
  } else if (estatuses.length > 0) {
    // If caller explicitly filters by statuses, still resolve IDs instead of strings.
    const statusIds = await getPedidoStatusIds(estatuses);
    where.id_estatus = { in: statusIds };
  }

  if (serviceIds.length > 0) {
    where.detalles = { some: { id_servicio: { in: serviceIds } } };
  }

  if (empresa || cliente) {
    where.cliente = {};
    if (empresa) {
      where.cliente.empresa = { contains: empresa, mode: "insensitive" };
    }
    if (cliente) {
      where.cliente.nombre_cliente = { contains: cliente, mode: "insensitive" };
    }
  }

  if (search) {
    where.OR = [
      {
        cliente: {
          nombre_cliente: {
            contains: search,
            mode: "insensitive",
          },
        },
      },
      {
        cliente: {
          empresa: {
            contains: search,
            mode: "insensitive",
          },
        },
      },
      {
        estatus: {
          descripcion: {
            contains: search,
            mode: "insensitive",
          },
        },
      },
    ];
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

export async function getPedido(id: number): Promise<Pedidos> {
  void id;
  throw new Error("Not implemented");
}

export async function createPedido(data: CreatePedidoInput): Promise<Pedidos> {
  void data;
  throw new Error("Not implemented");
}

export async function updatePedido(id: number, data: UpdatePedidoInput): Promise<Pedidos> {
  void id;
  void data;
  throw new Error("Not implemented");
}

export async function deletePedido(id: number): Promise<void> {
  // TODO: implement
  void id;
  throw new Error("Not implemented");
}

export async function getPedidoStatusId(description: string) {
  // Lookup status ID by description in catalog table.
  // This indirection allows DB-driven status values while keeping code strongly typed.
  const status = await prisma.estatusPedidos.findUnique({
    where: { descripcion: description },
  });
  if (!status) {
    throw new Error(`Pedido status '${description}' not found`);
  }
  return status.id_estatus;
}

export async function changePedidoStatus(
  pedidoId: number,
  targetStatus: PedidoStatus,
  userId: number
) {
  // Fetch current order to record previous status in history.
  const currentPedido = await prisma.pedidos.findUnique({
    where: { id_pedido: pedidoId },
  });
  if (!currentPedido) {
    throw new Error("Pedido not found");
  }

  const newStatusId = await getPedidoStatusId(targetStatus);

  // Transaction ensures atomicity: if either update or history fails,
  // neither change is committed. This guarantees traceability.
  const [updatedPedido] = await prisma.$transaction([
    prisma.pedidos.update({
      where: { id_pedido: pedidoId },
      data: { id_estatus: newStatusId },
    }),
    prisma.historialEstadosPedidos.create({
      data: {
        id_pedido: pedidoId,
        id_usuario: userId,
        id_estado_anterior: currentPedido.id_estatus,
        id_estado_nuevo: newStatusId,
        fecha_cambio: new Date(),
      },
    }),
  ]);

  return updatedPedido;
}
