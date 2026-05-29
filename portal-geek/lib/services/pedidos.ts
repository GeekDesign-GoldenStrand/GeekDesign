import type { Pedidos, Proveedores, Instaladores } from "@prisma/client";
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
        variablesCotizacion: {
          include: {
            variable: true;
          };
        };
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
  search?: string | null,
  fechaEstimadaDesde?: string | null,
  fechaEstimadaHasta?: string | null,
  detalleEstatuses: string[] = [],
  clienteEmpresa?: string | null
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

  // Combine service + detail-status filters into a single `detalles.some`
  // so we match pedidos whose detail for the selected service has the chosen
  // statuses (rather than ANDing two disjoint `some` predicates over different
  // details).
  if (serviceIds.length > 0 || detalleEstatuses.length > 0) {
    const detalleWhere: Prisma.DetallePedidoWhereInput = {};
    if (serviceIds.length > 0) {
      detalleWhere.id_servicio = { in: serviceIds };
    }
    if (detalleEstatuses.length > 0) {
      const statusIds = await getPedidoStatusIds(detalleEstatuses);
      // DetallePedido.id_estatus is nullable, and detalles created via
      // cotizacion → pedido start as NULL. The table UI renders those as
      // "Pendiente" (PedidosTable.tsx — detalle?.estatus?.descripcion ??
      // "Pendiente"), so the filter has to match the same fallback to stay
      // consistent with what the user sees.
      const includesPendiente = detalleEstatuses.includes(PEDIDO_STATUS.PENDIENTE);
      detalleWhere.OR = includesPendiente
        ? [{ id_estatus: { in: statusIds } }, { id_estatus: null }]
        : [{ id_estatus: { in: statusIds } }];
    }
    where.detalles = { some: detalleWhere };
  }

  if (clienteEmpresa) {
    where.cliente = {
      OR: [
        { empresa: { contains: clienteEmpresa, mode: "insensitive" } },
        { nombre_cliente: { contains: clienteEmpresa, mode: "insensitive" } },
      ],
    };
  } else if (empresa || cliente) {
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

  if (fechaEstimadaDesde || fechaEstimadaHasta) {
    const range: Prisma.DateTimeFilter = {};
    if (fechaEstimadaDesde) range.gte = new Date(fechaEstimadaDesde);
    if (fechaEstimadaHasta) {
      const hasta = new Date(fechaEstimadaHasta);
      hasta.setHours(23, 59, 59, 999);
      range.lte = hasta;
    }
    where.fecha_estimada = range;
  }

  if (search) {
    where.OR = [
      { nombre_oportunidad: { contains: search, mode: "insensitive" } },
      { cotizaciones: { some: { folio: { contains: search, mode: "insensitive" } } } },
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
            variablesCotizacion: {
              include: {
                variable: true,
              },
            },
          },
          orderBy: {
            id_detalle: "asc",
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
      estatus: true;
      variablesCotizacion: {
        include: {
          variable: true;
        };
      };
    };
  }>[];
  pagos: Prisma.PagosGetPayload<true>[];
  historial: {
    fecha_cambio: Date;
    estatus_anterior: string | null;
    estatus_nuevo: string;
    cambiado_por: string;
  }[];
  /** True when at least one detail line has a linked proveedor or instalador. */
  hasTerceros: boolean;
};

// PE-05 — Dirección consulta los detalles de un pedido específico.
// Aggregates the order header, its line items, payments and status history.
export async function getPedido(id: number): Promise<PedidoDetalleResponse> {
  const [pedido, terceroCount] = await Promise.all([
    prisma.pedidos.findUnique({
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
            estatus: true,
            variablesCotizacion: {
              include: {
                variable: true,
              },
            },
          },
          orderBy: { id_detalle: "asc" },
        },
        pagos: { orderBy: { fecha: "asc" } },
        historial: {
          include: { usuario: { select: { nombre_completo: true } } },
          orderBy: { fecha_cambio: "asc" },
        },
      },
    }),
    prisma.detallePedido.count({
      where: {
        id_pedido: id,
        OR: [
          { servicio: { proveedorPrecios: { some: {} } } },
          { material: { proveedorPrecios: { some: {} } } },
          { servicio: { instaladorServicios: { some: {} } } },
        ],
      },
    }),
  ]);

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
    hasTerceros: terceroCount > 0,
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

// ─── getOrderThirdParties ─────────────────────────────────────────────────────
//
// Include configs defined as `const` so TypeScript can derive exact payload
// types from them.

const PEDIDO_TERCEROS_INCLUDE = {
  cliente: true,
  sucursal: true,
} as const;

// For each detalle we need only the priced paths:
//   • servicio.proveedorPrecios → ProveedorPrecios rows where id_servicio matches (price B)
//   • servicio.instaladorServicios → InstaladorServicios rows where id_servicio matches (price B)
//   • material.proveedorPrecios → ProveedorPrecios rows where id_material matches (price C)
//
// Servicios.id_proveedor and Servicios.id_instalador (direct FKs) are intentionally
// excluded — they carry no price row and a purchase order cannot be raised without one.
const DETALLE_TERCEROS_INCLUDE = {
  servicio: {
    include: {
      proveedorPrecios: {
        include: { proveedor: true },
      },
      instaladorServicios: {
        include: { instalador: true },
      },
    },
  },
  material: {
    include: {
      proveedorPrecios: {
        include: { proveedor: true },
      },
    },
  },
} as const;

// Payload types derived from the include configs — no manual duplication.
type PedidoConTerceros = Prisma.PedidosGetPayload<{
  include: typeof PEDIDO_TERCEROS_INCLUDE;
}>;

type DetalleConTerceros = Prisma.DetallePedidoGetPayload<{
  include: typeof DETALLE_TERCEROS_INCLUDE;
}>;

type ProveedorPrecioConProveedor = Prisma.ProveedorPreciosGetPayload<{
  include: { proveedor: true };
}>;

type InstaladorServicioConInstalador = Prisma.InstaladorServiciosGetPayload<{
  include: { instalador: true };
}>;

// Public-facing types for the map entries.
export type ProveedorEntry = {
  /** The supplier linked to one or more line items. */
  proveedor: Proveedores;
  /** Every DetallePedido that references this supplier (deduplicated). */
  detalles: DetalleConTerceros[];
  /** ProveedorPrecios rows that link this supplier to the order (always non-empty). */
  precios: ProveedorPrecioConProveedor[];
};

export type InstaladorEntry = {
  /** The installer linked to one or more line items. */
  instalador: Instaladores;
  /** Every DetallePedido that references this installer (deduplicated). */
  detalles: DetalleConTerceros[];
  /** InstaladorServicios rows that link this installer to the order (always non-empty). */
  costos: InstaladorServicioConInstalador[];
};

export type OrderThirdPartiesResult = {
  pedido: PedidoConTerceros;
  /** Convenience alias — same object as pedido.sucursal; may be null. */
  sucursal: PedidoConTerceros["sucursal"];
  /** Keyed by id_proveedor. */
  proveedorMap: Map<number, ProveedorEntry>;
  /** Keyed by id_instalador. */
  instaladorMap: Map<number, InstaladorEntry>;
};

/**
 * Builds the third-party (proveedor / instalador) groupings for a Pedido.
 *
 * Only priced paths are considered — Servicios.id_proveedor and
 * Servicios.id_instalador (direct FKs) are excluded because they carry no
 * price row and a purchase order cannot be raised without one.
 *
 * A DetallePedido is linked to a Proveedor when:
 *   B – A ProveedorPrecios row exists with id_servicio = detalle.id_servicio, OR
 *   C – A ProveedorPrecios row exists with id_material = detalle.id_material.
 *
 * A DetallePedido is linked to an Instalador when:
 *   B – An InstaladorServicios row exists with id_servicio = detalle.id_servicio.
 *
 * Duplicates are suppressed: if multiple paths lead to the same third party
 * for the same detalle, the detalle appears only once in that entry's list.
 */
export async function getOrderThirdParties(id_pedido: number): Promise<OrderThirdPartiesResult> {
  // Run both queries in parallel — if the pedido doesn't exist the detalles
  // query simply returns [] (no FK constraint stops it), so parallelism is safe.
  const [pedido, detalles] = await Promise.all([
    prisma.pedidos.findUnique({
      where: { id_pedido },
      include: PEDIDO_TERCEROS_INCLUDE,
    }),
    prisma.detallePedido.findMany({
      where: { id_pedido },
      include: DETALLE_TERCEROS_INCLUDE,
    }),
  ]);

  if (!pedido) {
    throw new NotFoundError(`Pedido ${id_pedido} no encontrado`);
  }

  const proveedorMap = new Map<number, ProveedorEntry>();
  const instaladorMap = new Map<number, InstaladorEntry>();

  for (const detalle of detalles) {
    // ── Proveedor grouping ──────────────────────────────────────────────────
    // addedToProveedores tracks which proveedor IDs already received *this*
    // detalle so we never push the same detalle twice into one entry.
    const addedToProveedores = new Set<number>();

    const upsertProveedor = (precio: ProveedorPrecioConProveedor) => {
      const { id_proveedor: id, proveedor } = precio;
      if (!proveedorMap.has(id)) {
        proveedorMap.set(id, { proveedor, detalles: [], precios: [] });
      }
      const entry = proveedorMap.get(id)!;

      // Detalle deduplication: each detalle appears at most once per proveedor.
      if (!addedToProveedores.has(id)) {
        entry.detalles.push(detalle);
        addedToProveedores.add(id);
      }

      // Precio deduplication: the same ProveedorPrecios row can surface via
      // multiple detalles sharing the same service or material.
      if (!entry.precios.some((p) => p.id_proveedor_precio === precio.id_proveedor_precio)) {
        entry.precios.push(precio);
      }
    };

    // Path B — ProveedorPrecios where id_servicio matches
    for (const precio of detalle.servicio.proveedorPrecios) {
      upsertProveedor(precio);
    }

    // Path C — ProveedorPrecios where id_material matches
    for (const precio of detalle.material.proveedorPrecios) {
      upsertProveedor(precio);
    }

    // ── Instalador grouping ─────────────────────────────────────────────────
    const addedToInstaladores = new Set<number>();

    const upsertInstalador = (costo: InstaladorServicioConInstalador) => {
      const { id_instalador: id, instalador } = costo;
      if (!instaladorMap.has(id)) {
        instaladorMap.set(id, { instalador, detalles: [], costos: [] });
      }
      const entry = instaladorMap.get(id)!;

      if (!addedToInstaladores.has(id)) {
        entry.detalles.push(detalle);
        addedToInstaladores.add(id);
      }

      if (!entry.costos.some((c) => c.id_instalador_servicio === costo.id_instalador_servicio)) {
        entry.costos.push(costo);
      }
    };

    // Path B — InstaladorServicios where id_servicio matches
    for (const costo of detalle.servicio.instaladorServicios) {
      upsertInstalador(costo);
    }
  }

  return {
    pedido,
    sucursal: pedido.sucursal,
    proveedorMap,
    instaladorMap,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

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
