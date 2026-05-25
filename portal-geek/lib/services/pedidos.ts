import type { Pedidos } from "@prisma/client";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/client";
import type { CreatePedidoInput, UpdatePedidoInput } from "@/lib/schemas/pedidos";
import { NotFoundError } from "@/lib/utils/errors";

// Type for pedidos including frontend-required relations
type PedidoWithRelations = Prisma.PedidosGetPayload<{
  include: {
    cliente: true;
    sucursal: true;
    estatus: true;
    estado_factura: true;
    cotizaciones: {
      select: {
        folio: true;
        monto_total: true;
      };
    };
    detalles: {
      include: {
        servicio: true;
        material: true;
        archivo: true;
        estatus: true;
      };
    };
  };
}>;

export type PedidoServiceStatusSummary = Record<PedidoStatus, number>;

export type PedidoListItem = PedidoWithRelations & {
  serviceStatusSummary: PedidoServiceStatusSummary;
};

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

const EMPTY_SERVICE_STATUS_SUMMARY: PedidoServiceStatusSummary = {
  [PEDIDO_STATUS.PENDIENTE]: 0,
  [PEDIDO_STATUS.EN_PRODUCCION]: 0,
  [PEDIDO_STATUS.FINALIZADO]: 0,
  [PEDIDO_STATUS.ENTREGADO]: 0,
  [PEDIDO_STATUS.CANCELADO]: 0,
};

function buildServiceStatusSummary(detalles: PedidoWithRelations["detalles"]) {
  const summary: PedidoServiceStatusSummary = {
    ...EMPTY_SERVICE_STATUS_SUMMARY,
  };

  for (const detalle of detalles) {
    const status = (detalle.estatus?.descripcion ?? PEDIDO_STATUS.PENDIENTE) as PedidoStatus;

    if (status in summary) {
      summary[status] += 1;
    }
  }

  return summary;
}

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
): Promise<{ items: PedidoListItem[]; total: number }> {
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
            folio: true,
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
            estatus: true,
          },
        },
      },

      orderBy: {
        fecha_creacion: "desc",
      },
    }),

    prisma.pedidos.count({ where }),
  ]);

  const mappedItems = items.map((pedido) => ({
    ...pedido,
    serviceStatusSummary: buildServiceStatusSummary(pedido.detalles),
  }));

  return { items: mappedItems, total };
}

// Shape returned by getPedido — mirrors the PE-05 sequence diagram:
// { pedido, detalle[], pagos[], historial[] }
export type PedidoDetalleResponse = {
  pedido: Prisma.PedidosGetPayload<{
    include: {
      cliente: true;
      estatus: true;
      estado_factura: true;
      sucursal: true;
    };
  }>;
  detalle: Prisma.DetallePedidoGetPayload<{
    include: {
      servicio: { select: { nombre_servicio: true } };
      material: { select: { nombre_material: true } };
      archivo: { select: { nombre_archivo: true; url_archivo: true; formato: true } };
    };
  }>[];
  pagos: Prisma.PagosGetPayload<true>[];
  historial: {
    fecha_cambio: Date;
    estatus_anterior: string | null;
    estatus_nuevo: string;
    cambiado_por: string;
  }[];
};

// PE-05 — Dirección consulta los detalles de un pedido específico.
// Aggregates the order header, its line items, payments and status history.
export async function getPedido(id: number): Promise<PedidoDetalleResponse> {
  const pedido = await prisma.pedidos.findUnique({
    where: { id_pedido: id },
    include: {
      cliente: true,
      estatus: true,
      estado_factura: true,
      sucursal: true,
      detalles: {
        include: {
          servicio: { select: { nombre_servicio: true } },
          material: { select: { nombre_material: true } },
          archivo: { select: { nombre_archivo: true, url_archivo: true, formato: true } },
        },
        orderBy: { id_detalle: "asc" },
      },
      pagos: { orderBy: { fecha: "asc" } },
      historial: {
        include: { usuario: { select: { nombre_completo: true } } },
        orderBy: { fecha_cambio: "asc" },
      },
    },
  });

  if (!pedido) {
    throw new NotFoundError("Pedido no encontrado");
  }

  const { detalles, pagos, historial, ...header } = pedido;

  // HistorialEstadosPedidos stores plain status IDs (no relations), so resolve
  // their descriptions from the catalog in a single lookup.
  const statusIds = Array.from(
    new Set(
      historial.flatMap((h) =>
        h.id_estado_anterior != null
          ? [h.id_estado_anterior, h.id_estado_nuevo]
          : [h.id_estado_nuevo]
      )
    )
  );

  const statuses = await prisma.estatusPedidos.findMany({
    where: { id_estatus: { in: statusIds } },
    select: { id_estatus: true, descripcion: true },
  });

  const statusById = new Map(statuses.map((s) => [s.id_estatus, s.descripcion]));

  return {
    pedido: header,
    detalle: detalles,
    pagos,
    historial: historial.map((h) => ({
      fecha_cambio: h.fecha_cambio,
      estatus_anterior:
        h.id_estado_anterior != null ? (statusById.get(h.id_estado_anterior) ?? null) : null,
      estatus_nuevo: statusById.get(h.id_estado_nuevo) ?? "Desconocido",
      cambiado_por: h.usuario.nombre_completo,
    })),
  };
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

type PrismaTransaction = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

async function getPedidoStatusId(
  status: string,
  client: typeof prisma | PrismaTransaction = prisma
) {
  const estatus = await client.estatusPedidos.findUnique({
    where: {
      descripcion: status,
    },
  });

  if (!estatus) {
    throw new NotFoundError(`Pedido status '${status}' not found`);
  }

  return estatus.id_estatus;
}

export async function listActivePedidoServices() {
  return prisma.servicios.findMany({
    where: {
      estatus_servicio: true,
    },
    select: {
      id_servicio: true,
      nombre_servicio: true,
    },
    orderBy: {
      nombre_servicio: "asc",
    },
  });
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

export async function changeDetallePedidoStatus(
  detalleId: number,
  targetStatus: PedidoStatus,
  userId: number
) {
  return prisma.$transaction(async (tx) => {
    const currentDetalle = await tx.detallePedido.findUnique({
      where: {
        id_detalle: detalleId,
      },
      include: {
        estatus: true,
      },
    });

    if (!currentDetalle) {
      throw new NotFoundError("Detalle de pedido not found");
    }

    const currentStatus = (currentDetalle.estatus?.descripcion ??
      PEDIDO_STATUS.PENDIENTE) as PedidoStatus;

    const isCurrentFinalStatus =
      currentStatus === PEDIDO_STATUS.ENTREGADO || currentStatus === PEDIDO_STATUS.CANCELADO;

    if (isCurrentFinalStatus && targetStatus !== currentStatus) {
      throw new Error(
        `No se puede cambiar el estatus de un servicio que ya está '${currentStatus}'`
      );
    }

    const dbStatus = PEDIDO_STATUS_API_TO_DB[targetStatus];
    const newStatusId = await getPedidoStatusId(dbStatus, tx);

    const updatedDetalle = await tx.detallePedido.update({
      where: {
        id_detalle: detalleId,
      },
      data: {
        id_estatus: newStatusId,
        id_usuario_modificacion: userId,
        fecha_modificacion: new Date(),
      },
    });

    const detallesPedido = await tx.detallePedido.findMany({
      where: {
        id_pedido: currentDetalle.id_pedido,
      },
      include: {
        estatus: true,
      },
    });

    const allDetailsAreFinal =
      detallesPedido.length > 0 &&
      detallesPedido.every((detalle) => {
        const status = detalle.estatus?.descripcion ?? PEDIDO_STATUS.PENDIENTE;

        return status === PEDIDO_STATUS.ENTREGADO || status === PEDIDO_STATUS.CANCELADO;
      });

    if (allDetailsAreFinal) {
      const allDetailsAreCanceled = detallesPedido.every(
        (detalle) => detalle.estatus?.descripcion === PEDIDO_STATUS.CANCELADO
      );

      const finalPedidoStatus = allDetailsAreCanceled
        ? PEDIDO_STATUS.CANCELADO
        : PEDIDO_STATUS.ENTREGADO;

      const finalPedidoStatusId = await getPedidoStatusId(finalPedidoStatus, tx);

      await tx.pedidos.update({
        where: {
          id_pedido: currentDetalle.id_pedido,
        },
        data: {
          id_estatus: finalPedidoStatusId,
        },
      });
    }

    return updatedDetalle;
  });
}
