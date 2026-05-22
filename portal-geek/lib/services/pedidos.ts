import type { Pedidos } from "@prisma/client";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/client";
import type { CreatePedidoInput, UpdatePedidoInput } from "@/lib/schemas/pedidos";

// Type for pedidos including frontend-required relations
type PedidoWithRelations = Prisma.PedidosGetPayload<{
  include: {
    cliente: true;
    sucursal: true;
    estatus: true;
    cotizaciones: {
      select: {
        monto_total: true;
      };
    };
    detalles: {
      include: {
        servicio: true;
        material: true;
        archivo: true;
      };
    };
  };
}>;

// Centralized catalog of order statuses.
// Using constants avoids scattered "magic strings" and makes refactoring safer.
export const PEDIDO_STATUS = {
  PENDIENTE: "Pendiente",
  EN_PRODUCCION: "En producción",
  FINALIZADO: "Finalizado",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
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
): Promise<{ items: PedidoWithRelations[]; total: number }> {
  const skip = (page - 1) * pageSize;

  // Build dynamic filter conditions
  const where: Prisma.PedidosWhereInput = {};

  if (onlyActive) {
    // Resolve inactive status IDs once and filter by ID.
    const inactiveStatusIds = await getPedidoStatusIds(["Entregado", "Cancelado"]);
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
      where.cliente.empresa = {
        contains: empresa,
        mode: "insensitive",
      };
    }

    if (cliente) {
      where.cliente.nombre_cliente = {
        contains: cliente,
        mode: "insensitive",
      };
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
      where,
      skip,
      take: pageSize,

      include: {
        cliente: true,
        sucursal: true,
        estatus: true,
        estado_factura: true,

        // Pull latest quotation amount for frontend "Monto" column
        cotizaciones: {
          select: {
            monto_total: true,
          },
          orderBy: {
            fecha_creacion: "desc",
          },
          take: 1,
        },

        detalles: {
          include: {
            servicio: true,
            material: true,
            archivo: true,
          },
        },
      },

      orderBy: {
        fecha_creacion: "desc",
      },
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

const PEDIDO_STATUS_API_TO_DB: Record<PedidoStatus, string> = {
  [PEDIDO_STATUS.PENDIENTE]: "Pendiente",
  [PEDIDO_STATUS.EN_PRODUCCION]: "En producción",
  [PEDIDO_STATUS.FINALIZADO]: "Finalizado",
  [PEDIDO_STATUS.ENTREGADO]: "Entregado",
  [PEDIDO_STATUS.CANCELADO]: "Cancelado",
};

export async function changePedidoStatus(
  pedidoId: number,
  targetStatus: PedidoStatus,
  userId: number
) {
  // Fetch current order including current status.
  const currentPedido = await prisma.pedidos.findUnique({
    where: { id_pedido: pedidoId },
    include: {
      estatus: true,
    },
  });

  if (!currentPedido) {
    throw new Error("Pedido not found");
  }

  const currentStatus = currentPedido.estatus.descripcion as PedidoStatus;

  // Valid workflow transitions:
  // Only Entregado and Cancelado are final states.
  // Any other status can move to any other status.
  const isFinalStatus =
    currentStatus === PEDIDO_STATUS.ENTREGADO || currentStatus === PEDIDO_STATUS.CANCELADO;

  if (isFinalStatus && targetStatus !== currentStatus) {
    throw new Error(`No se puede cambiar el estatus de un pedido que ya está '${currentStatus}'`);
  }

  const dbStatus = PEDIDO_STATUS_API_TO_DB[targetStatus];

  const newStatusId = await getPedidoStatusId(dbStatus);

  // Transaction ensures atomicity:
  // if either update or history creation fails,
  // neither operation is committed.
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
