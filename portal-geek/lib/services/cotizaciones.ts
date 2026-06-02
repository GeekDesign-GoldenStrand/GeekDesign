import type {
  Cotizaciones,
  CotizacionesRechazadas,
  HistorialEstadosCotizacion,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/db/client";
import type {
  CreateCotizacionInput,
  SolicitarCotizacionInput,
  UpdateCotizacionInput,
} from "@/lib/schemas/cotizaciones";
import { calcularPrecioServicio } from "@/lib/services/formula-pricing";
import { getPlaceholderArchivoId, getSistemaUserId } from "@/lib/services/sistema";
import {
  ConfigurationError,
  ConflictError,
  DataInconsistencyError,
  NotFoundError,
  ValidationError,
} from "@/lib/utils/errors";
// Catalog of quotation statuses lives in @/types/cotizacion so both the
// server (this file) and the client (CotizacionDetailPage, etc.) read from
// the same source. Re-exported further down so existing service consumers
// don't have to update their imports.
import { QUOTATION_STATUS, toEstatusCotizacion, type QuotationStatus } from "@/types/cotizacion";

/**
 * Common include configuration for quotations to ensure consistent typing.
 */
const INCLUDE_CONFIG = {
  cliente: true,
  estatus: true,
  variablesCotizacion: {
    include: {
      variable: {
        include: {
          formula: {
            include: {
              servicio: true,
            },
          },
        },
      },
    },
  },
  pedido: {
    include: {
      estatus: true,
      estado_factura: true,
      detalles: {
        include: {
          servicio: true,
          archivo: true,
        },
      },
    },
  },
} as const;

export type CotizacionWithRelations = Prisma.CotizacionesGetPayload<{
  include: typeof INCLUDE_CONFIG;
}>;

// Detail view used by GET /api/cotizaciones/[id] AND by the storefront
// page fallback. Designed as a strict superset of INCLUDE_CONFIG so the
// payload remains assignable to CotizacionWithRelations:
//   - admin detail needs material + archivo on each detalle, historial
//     with usuario + cliente, variablesCotizacion.usuario, rechazada
//   - storefront needs pedido.estatus + estado_factura and the
//     variable → formula → servicio chain
// Keeping both unioned in one include keeps a single source of truth and
// avoids a second `findUnique` per request.
const DETAIL_INCLUDE = {
  cliente: true,
  estatus: true,
  pedido: {
    include: {
      estatus: true,
      estado_factura: true,
      detalles: {
        include: { servicio: true, material: true, archivo: true },
      },
    },
  },
  historial: {
    include: {
      usuario: { select: { nombre_completo: true } },
      cliente: { select: { nombre_cliente: true } },
    },
  },
  variablesCotizacion: {
    include: {
      variable: {
        include: {
          formula: { include: { servicio: true } },
        },
      },
      usuario: { select: { nombre_completo: true } },
    },
  },
  rechazada: true,
} as const;

type CotizacionDetailBase = Prisma.CotizacionesGetPayload<{
  include: typeof DETAIL_INCLUDE;
}>;

// Service-enriched: each historial entry gets the resolved label strings
// looked up against the EstatusCotizacion catalog so the UI doesn't have
// to hold the catalog itself.
export type CotizacionDetail = Omit<CotizacionDetailBase, "historial"> & {
  historial: (CotizacionDetailBase["historial"][number] & {
    estado_anterior_label: string | null;
    estado_nuevo_label: string;
  })[];
};

// Copilot review #1: emails must be normalized before any Postgres @unique
// lookup or comparison. Postgres unique indexes are case-sensitive, and the
// approve/cancel handlers compare with `.toLowerCase()` on a `.trim()`-less
// header — keep both sides consistent by routing every email through this.
const normalizeEmail = (e: string) => e.trim().toLowerCase();

// Re-export the catalog so existing `import { QUOTATION_STATUS } from
// "@/lib/services/cotizaciones"` consumers keep resolving without edits.
// The actual import lives at the top of the file with the rest of the
// imports (see @/types/cotizacion).
export { QUOTATION_STATUS };
export type { QuotationStatus };

export async function listCotizaciones(
  page: number,
  pageSize: number,
  filters?: {
    cliente?: string;
    empresa?: string;
    estatus?: string[];
    search?: string;
    includeFinished?: boolean;
    fechaFinDesde?: string;
    fechaFinHasta?: string;
  }
): Promise<{ items: CotizacionWithRelations[]; total: number }> {
  const skip = (page - 1) * pageSize;

  const where: Prisma.CotizacionesWhereInput = {};

  // By default, we only show "Active" quotes (Pendiente, Validada) in the main admin view.
  // Approved quotes move to Pedidos, and Rejected ones move to a separate view.
  if (!filters?.includeFinished && (!filters?.estatus || filters.estatus.length === 0)) {
    where.estatus = {
      descripcion: {
        in: [QUOTATION_STATUS.PENDIENTE, QUOTATION_STATUS.VALIDADA],
      },
    };
  }

  if (filters?.estatus && filters.estatus.length > 0) {
    where.estatus = { descripcion: { in: filters.estatus } };
  }

  if (filters?.fechaFinDesde || filters?.fechaFinHasta) {
    const range: Prisma.DateTimeFilter = {};
    if (filters.fechaFinDesde) range.gte = new Date(filters.fechaFinDesde);
    if (filters.fechaFinHasta) {
      // Include the entire "hasta" day by pinning to end-of-day.
      const hasta = new Date(filters.fechaFinHasta);
      hasta.setHours(23, 59, 59, 999);
      range.lte = hasta;
    }
    where.fecha_fin = range;
  }

  const andConditions: Prisma.CotizacionesWhereInput[] = [];

  if (filters?.cliente) {
    andConditions.push({
      OR: [
        { cliente: { nombre_cliente: { contains: filters.cliente, mode: "insensitive" } } },
        { empresa_cliente: { contains: filters.cliente, mode: "insensitive" } },
        { cliente: { empresa: { contains: filters.cliente, mode: "insensitive" } } },
      ],
    });
  }

  if (filters?.search) {
    andConditions.push({
      OR: [
        { folio: { contains: filters.search, mode: "insensitive" } },
        { nombre_oportunidad: { contains: filters.search, mode: "insensitive" } },
      ],
    });
  }

  if (andConditions.length > 0) {
    where.AND = andConditions;
  }

  // Single snapshot for count + findMany so concurrent writes can't make page
  // N show 0 items while total > 0.
  const [items, total] = await prisma.$transaction([
    prisma.cotizaciones.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { id_cotizacion: "asc" },
      include: INCLUDE_CONFIG,
    }),
    prisma.cotizaciones.count({ where }),
  ]);

  return { items, total };
}

export async function getCotizacion(id: number): Promise<CotizacionDetail | null> {
  return prisma.$transaction(async (tx) => {
    const cotizacion = await tx.cotizaciones.findUnique({
      where: { id_cotizacion: id },
      include: {
        ...DETAIL_INCLUDE,
        // orderBy lives on the live query, not on the include type — keeps
        // DETAIL_INCLUDE pure structural so GetPayload stays sharp.
        historial: {
          ...DETAIL_INCLUDE.historial,
          orderBy: { fecha_cambio: "asc" },
        },
      },
    });

    if (!cotizacion) return null;

    const estatuses = await tx.estatusCotizacion.findMany();
    const estatusMap = new Map(estatuses.map((e) => [e.id_estatus, e.descripcion]));

    return {
      ...cotizacion,
      historial: cotizacion.historial.map((h) => ({
        ...h,
        estado_anterior_label: h.id_estado_anterior
          ? (estatusMap.get(h.id_estado_anterior) ?? String(h.id_estado_anterior))
          : null,
        estado_nuevo_label: estatusMap.get(h.id_estado_nuevo) ?? String(h.id_estado_nuevo),
      })),
    };
  });
}

/**
 * Fetch a quotation by its Folio number.
 * Used for public client lookup.
 */
export async function getCotizacionByFolio(folio: string): Promise<CotizacionWithRelations | null> {
  return prisma.cotizaciones.findUnique({
    where: { folio },
    include: INCLUDE_CONFIG,
  });
}

export async function createCotizacion(data: CreateCotizacionInput): Promise<Cotizaciones> {
  // Every new quotation must start as "Pendiente"
  // to guarantee a consistent initial workflow state.
  const pendingStatusId = 1;

  return prisma.cotizaciones.create({
    data: {
      id_cliente: data.id_cliente,
      id_pedido: data.id_pedido ?? null,
      monto_total: data.monto_total,
      empresa_cliente: data.empresa_cliente ?? null,
      folio: data.folio ?? null,
      fecha_fin: data.fecha_fin ?? null,
      pdf_url: data.pdf_url ?? null,
      notas: data.notas ?? null,
      id_estatus_cotizacion: pendingStatusId,
    },
  });
}

export async function updateCotizacion(
  id: number,
  data: UpdateCotizacionInput
): Promise<Cotizaciones> {
  return prisma.$transaction(async (tx) => {
    // Lock the Cotizaciones row so a concurrent aplicarDescuento can't mutate
    // monto_total against an out-of-date base. Both write paths take this lock.
    await tx.$queryRaw`SELECT 1 FROM "COTIZACIONES" WHERE id_cotizacion = ${id} FOR UPDATE`;

    const existing = await tx.cotizaciones.findUnique({
      where: { id_cotizacion: id },
      select: {
        id_cotizacion: true,
        id_pedido: true,
        porcentaje_descuento: true,
        estatus: { select: { descripcion: true } },
      },
    });

    if (!existing) {
      throw new NotFoundError(`Cotización ${id} no encontrada`);
    }

    // Pendiente-only — once the cliente validates the quote (or moves
    // beyond), line items become immutable. Same rule as aplicarDescuento
    // so the two write paths stay aligned: any mutation that affects the
    // saved monto_total is locked behind this single transition gate.
    if (existing.estatus.descripcion !== QUOTATION_STATUS.PENDIENTE) {
      throw new ConflictError(
        `Solo se pueden modificar cotizaciones en estatus 'Pendiente' (actual: '${existing.estatus.descripcion}')`
      );
    }

    let computedMontoTotal: number | undefined;

    if (data.servicios && data.servicios.length > 0) {
      if (!existing.id_pedido) {
        throw new ConflictError("La cotización no tiene un pedido vinculado");
      }

      // IDOR guard: `id_detalle` arrives from the request body. Without
      // scoping to this cotización's `id_pedido` a caller could update line
      // items that belong to a completely different quote. Resolve the
      // allow-list once up-front, validate every id, and only then write.
      const ownedDetalles = await tx.detallePedido.findMany({
        where: { id_pedido: existing.id_pedido },
        select: { id_detalle: true },
      });
      const ownedIds = new Set(ownedDetalles.map((d) => d.id_detalle));

      for (const s of data.servicios) {
        if (!ownedIds.has(s.id_detalle)) {
          throw new NotFoundError(`Detalle ${s.id_detalle} no pertenece a la cotización ${id}`);
        }
      }

      for (const s of data.servicios) {
        await tx.detallePedido.update({
          where: { id_detalle: s.id_detalle },
          data: {
            cantidad: s.cantidad,
            precio_unitario: s.precio_unitario,
            subtotal: s.cantidad * s.precio_unitario,
          },
        });
      }

      const detalles = await tx.detallePedido.findMany({
        where: { id_pedido: existing.id_pedido },
        select: { subtotal: true },
      });
      const baseSum = detalles.reduce((sum, d) => sum + Number(d.subtotal), 0);

      // Re-apply the stored discount so monto_total stays consistent with
      // porcentaje_descuento. Without this the row would drift to an
      // un-discounted total while still advertising a discount %.
      const pct = existing.porcentaje_descuento ? Number(existing.porcentaje_descuento) : 0;
      computedMontoTotal = pct > 0 ? Math.round(baseSum * (1 - pct / 100) * 100) / 100 : baseSum;

      // monto_total is Decimal(10,2) — values above 99,999,999.99 trigger a
      // Postgres "numeric field overflow" that surfaces to the client as a
      // 500. Catch it here and return 422 with an actionable message so the
      // user can adjust line items instead of seeing "Error interno".
      // Per-item subtotal is already bounded by the Zod cap on
      // precio_unitario * cantidad — this catches the sum across many lines.
      const MONTO_TOTAL_MAX = 99999999.99;
      if (baseSum > MONTO_TOTAL_MAX || computedMontoTotal > MONTO_TOTAL_MAX) {
        throw new ValidationError(
          `El monto total de la cotización no puede superar ${MONTO_TOTAL_MAX.toLocaleString("es-MX")}. Reduce alguna cantidad o precio unitario.`
        );
      }
    }

    // Use Prisma's checked update type so each field write is validated
    // against the schema (e.g. fecha_* must be Date | string, not arbitrary).
    const updateData: Prisma.CotizacionesUpdateInput = {};

    if (data.id_cliente !== undefined) {
      updateData.cliente = { connect: { id_cliente: data.id_cliente } };
    }
    if (data.nombre_oportunidad !== undefined)
      updateData.nombre_oportunidad = data.nombre_oportunidad;
    if (data.id_estatus_cotizacion !== undefined)
      updateData.estatus = { connect: { id_estatus: data.id_estatus_cotizacion } };
    if (data.empresa_cliente !== undefined) updateData.empresa_cliente = data.empresa_cliente;
    if (data.fecha_fin !== undefined) updateData.fecha_fin = data.fecha_fin;
    if (data.fecha_validacion !== undefined) updateData.fecha_validacion = data.fecha_validacion;
    if (data.fecha_aprobacion !== undefined) updateData.fecha_aprobacion = data.fecha_aprobacion;
    if (data.pdf_url !== undefined) updateData.pdf_url = data.pdf_url;
    if (data.notas !== undefined) updateData.notas = data.notas;

    // Prefer the server-recomputed total over whatever the caller sent.
    const montoTotal = computedMontoTotal ?? data.monto_total;
    if (montoTotal !== undefined) updateData.monto_total = montoTotal;

    // Mirror nombre_oportunidad onto the linked Pedido so the Pedidos table
    // doesn't drift from the cotización it was generated from.
    if (data.nombre_oportunidad !== undefined && existing.id_pedido) {
      await tx.pedidos.update({
        where: { id_pedido: existing.id_pedido },
        data: { nombre_oportunidad: data.nombre_oportunidad },
      });
    }

    return tx.cotizaciones.update({
      where: { id_cotizacion: id },
      data: updateData,
    });
  });
}

export async function deleteCotizacion(id: number): Promise<void> {
  // Placeholder until implemented.
  void id;
  throw new Error("Not implemented");
}

export async function aplicarDescuento(
  id_cotizacion: number,
  porcentaje: number | null,
  motivo?: string | null
) {
  return prisma.$transaction(async (tx) => {
    // Lock the row so updateCotizacion and aplicarDescuento can't both rewrite
    // monto_total off stale snapshots of the line items.
    await tx.$queryRaw`SELECT 1 FROM "COTIZACIONES" WHERE id_cotizacion = ${id_cotizacion} FOR UPDATE`;

    const cotizacion = await tx.cotizaciones.findUnique({
      where: { id_cotizacion },
      select: {
        id_cotizacion: true,
        monto_total: true,
        porcentaje_descuento: true,
        id_estatus_cotizacion: true,
        estatus: { select: { descripcion: true } },
        pedido: {
          select: {
            detalles: { select: { subtotal: true } },
          },
        },
      },
    });

    if (!cotizacion) {
      throw new NotFoundError("Cotización no encontrada");
    }

    // Discounts share the same Pendiente-only rule as line-item edits — once
    // the cliente has validated the quote, neither price nor discount can be
    // mutated. Covers both the "apply discount" and "remove discount"
    // (porcentaje === null) call paths since both write to the same fields.
    if (cotizacion.estatus.descripcion !== QUOTATION_STATUS.PENDIENTE) {
      throw new ConflictError(
        `Solo se pueden modificar cotizaciones en estatus 'Pendiente' (actual: '${cotizacion.estatus.descripcion}')`
      );
    }

    const detalles = cotizacion.pedido?.detalles ?? [];
    const baseOriginal = detalles.length
      ? detalles.reduce((acc, d) => acc + Number(d.subtotal), 0)
      : Number(cotizacion.monto_total);

    if (porcentaje === null) {
      return tx.cotizaciones.update({
        where: { id_cotizacion },
        data: {
          porcentaje_descuento: null,
          motivo_descuento: null,
          monto_total: baseOriginal,
        },
      });
    }

    const montoConDescuento = Math.round(baseOriginal * (1 - porcentaje / 100) * 100) / 100;
    const motivoNormalizado = motivo?.trim() ? motivo.trim() : null;

    return tx.cotizaciones.update({
      where: { id_cotizacion },
      data: {
        porcentaje_descuento: porcentaje,
        motivo_descuento: motivoNormalizado,
        monto_total: montoConDescuento,
      },
    });
  });
}

export async function getQuotationStatusId(description: string) {
  // Lookup status ID by description in catalog table.
  // This indirection allows DB-driven status values while keeping code strongly typed.
  const status = await prisma.estatusCotizacion.findUnique({
    where: { descripcion: description },
  });
  if (!status) {
    throw new ConfigurationError(`Quotation status '${description}' not found in catalog`);
  }
  return status.id_estatus;
}

export async function changeQuotationStatus(
  quotationId: number,
  targetStatus: QuotationStatus,
  userId: number
) {
  // Fetch current quotation including current status.
  const currentQuotation = await prisma.cotizaciones.findUnique({
    where: { id_cotizacion: quotationId },
    include: {
      estatus: true,
    },
  });

  if (!currentQuotation) {
    throw new Error("Quotation not found");
  }

  // descripcion comes from a VARCHAR(50) column with no enum constraint at
  // the DB level — narrow with the runtime guard before treating it as the
  // union, otherwise an off-catalog value would silently index past the
  // transition table below and pass an empty `allowedTransitions`.
  const currentStatus = toEstatusCotizacion(currentQuotation.estatus.descripcion);
  if (!currentStatus) {
    throw new Error(
      `Estado de cotización fuera del catálogo: '${currentQuotation.estatus.descripcion}'`
    );
  }

  // Valid workflow transitions.
  const ALLOWED_QUOTATION_TRANSITIONS: Record<QuotationStatus, QuotationStatus[]> = {
    [QUOTATION_STATUS.PENDIENTE]: [
      QUOTATION_STATUS.VALIDADA,
      QUOTATION_STATUS.CANCELADA,
      QUOTATION_STATUS.RECHAZADA,
    ],

    [QUOTATION_STATUS.VALIDADA]: [
      QUOTATION_STATUS.APROBADA,
      QUOTATION_STATUS.CANCELADA,
      QUOTATION_STATUS.RECHAZADA,
    ],

    [QUOTATION_STATUS.APROBADA]: [],

    [QUOTATION_STATUS.CANCELADA]: [],

    [QUOTATION_STATUS.RECHAZADA]: [],
  };

  const allowedTransitions = ALLOWED_QUOTATION_TRANSITIONS[currentStatus];

  // Prevent illegal workflow jumps.
  if (!allowedTransitions.includes(targetStatus)) {
    throw new Error(`Illegal status transition from '${currentStatus}' to '${targetStatus}'`);
  }

  const newStatusId = await getQuotationStatusId(targetStatus);

  // Automatically register milestone timestamps
  // only the first time each status is reached.
  const updateData: Prisma.CotizacionesUncheckedUpdateInput = {
    id_estatus_cotizacion: newStatusId,
  };

  if (targetStatus === QUOTATION_STATUS.VALIDADA && !currentQuotation.fecha_validacion) {
    updateData.fecha_validacion = new Date();
  }

  if (targetStatus === QUOTATION_STATUS.APROBADA && !currentQuotation.fecha_aprobacion) {
    updateData.fecha_aprobacion = new Date();
  }

  // Transaction ensures atomicity.
  // Register lost opportunities (Rejected or Cancelled)
  const isLostOpportunity =
    targetStatus === QUOTATION_STATUS.RECHAZADA || targetStatus === QUOTATION_STATUS.CANCELADA;

  const operations: (
    | Prisma.PrismaPromise<Cotizaciones>
    | Prisma.PrismaPromise<HistorialEstadosCotizacion>
    | Prisma.PrismaPromise<CotizacionesRechazadas>
    | Prisma.PrismaPromise<Prisma.BatchPayload>
  )[] = [
    prisma.cotizaciones.update({
      where: { id_cotizacion: quotationId },
      data: updateData,
    }),

    prisma.historialEstadosCotizacion.create({
      data: {
        id_cotizacion: quotationId,
        id_usuario: userId,
        id_estado_anterior: currentQuotation.id_estatus_cotizacion,
        id_estado_nuevo: newStatusId,
        fecha_cambio: new Date(),
        actor_tipo: "Direccion", // Called from admin side
      },
    }),
  ];

  if (isLostOpportunity) {
    operations.push(
      prisma.cotizacionesRechazadas.upsert({
        where: {
          id_cotizacion: quotationId,
        },
        update: {},
        create: {
          id_cotizacion: quotationId,
        },
      })
    );
  } else {
    // Remove from lost opportunities table if it moved back to an active state
    operations.push(
      prisma.cotizacionesRechazadas.deleteMany({
        where: {
          id_cotizacion: quotationId,
        },
      })
    );
  }

  const [updatedQuotation] = await prisma.$transaction(operations);

  return updatedQuotation;
}

/**
 * D5 refactor (ST-23 PR, refactor of ST-08): promotes the draft Pedido in place
 * instead of deleting and recreating it. The SRS contract for ST-08 is preserved
 * — "el estatus de la cotización cambia a 'aprobada'" — only the implementation
 * changes. Keeping the same id_pedido means VariablesCotizacion.id_detalle stays
 * valid, which matters once ST-23 starts attaching dimensions/cantidades via
 * those rows (D3).
 */
// KIKW12 review #1b: caller authorization (cliente proves email control via
// magic-link session cookie) is enforced at the route layer; the service runs
// only after the cookie has been verified against this quotationId.
export async function approveQuotation(quotationId: number) {
  return prisma.$transaction(async (tx) => {
    // Lock the Cotizaciones row before reading estatus to prevent double-submit
    // approving an already-approved/cancelled quotation. Without FOR UPDATE,
    // two concurrent requests both see estatus=Validada and both proceed.
    await tx.$queryRaw`SELECT 1 FROM "COTIZACIONES" WHERE id_cotizacion = ${quotationId} FOR UPDATE`;

    const quotation = await tx.cotizaciones.findUnique({
      where: { id_cotizacion: quotationId },
      include: { estatus: true, pedido: true, cliente: true },
    });

    if (!quotation) throw new NotFoundError("Cotización no encontrada");
    if (quotation.estatus.descripcion !== QUOTATION_STATUS.VALIDADA) {
      throw new ConflictError("Solo se pueden aprobar cotizaciones validadas");
    }
    if (!quotation.id_pedido) {
      throw new ValidationError("No se puede aprobar una cotización sin líneas validadas");
    }

    // D5: drop only the line items the cliente rejected during validation.
    // Active detalles stay attached to the same pedido — their VariablesCotizacion
    // links remain valid.
    //
    // Referential integrity: VariablesCotizacion.id_detalle has no onDelete rule in
    // the schema (PostgreSQL default = RESTRICT), so we must remove the variable rows
    // for the rejected detalles first, or the deleteMany below raises a FK violation.
    const rejectedDetalles = await tx.detallePedido.findMany({
      where: {
        id_pedido: quotation.id_pedido,
        notas: { contains: "[ESTADO:rechazado]" },
      },
      select: { id_detalle: true },
    });

    if (rejectedDetalles.length > 0) {
      const rejectedIds = rejectedDetalles.map((d) => d.id_detalle);
      await tx.variablesCotizacion.deleteMany({
        where: { id_detalle: { in: rejectedIds } },
      });
    }

    await tx.detallePedido.deleteMany({
      where: {
        id_pedido: quotation.id_pedido,
        notas: { contains: "[ESTADO:rechazado]" },
      },
    });

    const approvedStatus = await tx.estatusCotizacion.findUnique({
      where: { descripcion: QUOTATION_STATUS.APROBADA },
    });
    const aprobacionDiseno = await tx.estadoFacturaPedido.findUnique({
      where: { descripcion: "Aprobacion_diseno" },
    });

    if (!approvedStatus || !aprobacionDiseno) {
      throw new ConfigurationError("Required status catalogs not found");
    }

    // D5: promote the draft pedido in place — same id_pedido, new estado_factura.
    const pedido = await tx.pedidos.update({
      where: { id_pedido: quotation.id_pedido },
      data: { id_estado_factura: aprobacionDiseno.id_estado_factura },
    });

    const updatedQuotation = await tx.cotizaciones.update({
      where: { id_cotizacion: quotationId },
      data: {
        id_estatus_cotizacion: approvedStatus.id_estatus,
        fecha_aprobacion: new Date(),
      },
    });

    await tx.historialEstadosCotizacion.create({
      data: {
        id_cotizacion: quotationId,
        id_cliente: quotation.id_cliente,
        id_estado_anterior: quotation.id_estatus_cotizacion,
        id_estado_nuevo: approvedStatus.id_estatus,
        fecha_cambio: new Date(),
        actor_tipo: "Cliente",
      },
    });

    return { quotation: updatedQuotation, pedido };
  });
}

/**
 * Cancels a quotation by the client and moves it to the cancelled state.
 */
// KIKW12 review #1b: caller authorization handled at the route layer (see
// approveQuotation above). The service trusts that the route only invokes it
// after the magic-link session cookie has been verified.
export async function cancelQuotationByClient(quotationId: number, reason?: string) {
  return prisma.$transaction(async (tx) => {
    // Lock so concurrent approve/cancel can't both pass the estatus guard.
    await tx.$queryRaw`SELECT 1 FROM "COTIZACIONES" WHERE id_cotizacion = ${quotationId} FOR UPDATE`;

    const quotation = await tx.cotizaciones.findUnique({
      where: { id_cotizacion: quotationId },
      include: { estatus: true, cliente: true },
    });

    if (!quotation) throw new NotFoundError("Cotización no encontrada");

    if (
      !([QUOTATION_STATUS.PENDIENTE, QUOTATION_STATUS.VALIDADA] as string[]).includes(
        quotation.estatus.descripcion
      )
    ) {
      throw new ConflictError(
        `No se puede cancelar una cotización en estado '${quotation.estatus.descripcion}'`
      );
    }

    const cancelledStatus = await tx.estatusCotizacion.findUnique({
      where: { descripcion: QUOTATION_STATUS.CANCELADA },
    });

    if (!cancelledStatus)
      throw new ConfigurationError("Estado 'Cancelada' no encontrado en el catálogo");

    // Update quote status and add cancellation reason to notes
    const updatedQuotation = await tx.cotizaciones.update({
      where: { id_cotizacion: quotationId },
      data: {
        id_estatus_cotizacion: cancelledStatus.id_estatus,
        notas: reason
          ? `${quotation.notas ?? ""}\n\nMotivo de cancelación: ${reason}`
          : quotation.notas,
      },
    });

    // Ensure it's in the lost opportunities table
    await tx.cotizacionesRechazadas.upsert({
      where: { id_cotizacion: quotationId },
      update: {},
      create: { id_cotizacion: quotationId },
    });

    // Log history
    await tx.historialEstadosCotizacion.create({
      data: {
        id_cotizacion: quotationId,
        id_estado_anterior: quotation.id_estatus_cotizacion,
        id_estado_nuevo: cancelledStatus.id_estatus,
        fecha_cambio: new Date(),
        actor_tipo: "Cliente",
      },
    });

    return updatedQuotation;
  });
}

/**
 * ST-23: anonymous cliente submits a cart from the storefront. Atomically:
 *   1. upserts Cliente by correo_electronico (@unique, D8)
 *   2. recomputes each item's price server-side (never trusts the client)
 *   3. creates a draft Pedido + DetallePedido[]
 *   4. allocates a folio via the folio_seq Postgres sequence
 *   5. creates the Cotización (Pendiente) + VariablesCotizacion[] (id_usuario_asigno=SISTEMA)
 *   6. logs HistorialEstadosCotizacion with actor_tipo="Cliente"
 *
 * Returns the folio + monto_total + the lookup URL the cliente can use to
 * return later (also useful to embed in the confirmation email).
 */

export async function createCotizacionFromCart(
  input: SolicitarCotizacionInput
): Promise<{ folio: string; monto_total: number; id_cotizacion: number; lookup_url: string }> {
  // 1. Server-side price recomputation outside the tx (read-only) — fails fast
  //    on invalid material/formula before we open the transaction.
  const pricedItems = await Promise.all(
    input.items.map(async (item) => {
      const precioUnitario = await calcularPrecioServicio({
        id_servicio: item.id_servicio,
        id_material: item.id_material,
        variables: item.variables,
      });
      const formula = await prisma.formulas.findFirst({
        where: { id_servicio: item.id_servicio, estatus: "Activa" },
        include: { variables: true },
      });
      if (!formula) {
        throw new ValidationError(
          `Servicio ${item.id_servicio} no tiene una fórmula activa para cotizar`
        );
      }
      return {
        item,
        precioUnitario,
        subtotal: Math.round(precioUnitario * item.cantidad * 100) / 100,
        formulaVariables: formula.variables,
      };
    })
  );

  const monto_total = Math.round(pricedItems.reduce((sum, p) => sum + p.subtotal, 0) * 100) / 100;

  const sistemaUserId = await getSistemaUserId();
  const placeholderArchivoId = await getPlaceholderArchivoId();

  // Copilot review #1: normalize correo once before the tx so the unique
  // lookup, create, and any downstream comparison all see the same form.
  const correo = normalizeEmail(input.cliente.correo_electronico);

  // KIKW12 review #4: id_sucursal arrives from an anonymous client. Verify
  // the sucursal exists AND is Activo before using it — bad values would
  // otherwise produce an FK violation 500 or bind the Pedido to an inactive
  // branch.
  const sucursal = await prisma.sucursales.findUnique({
    where: { id_sucursal: input.id_sucursal },
    select: { id_sucursal: true, estatus: true },
  });
  if (!sucursal || sucursal.estatus !== "Activo") {
    throw new ValidationError(`Sucursal ${input.id_sucursal} no existe o no está activa`);
  }

  return prisma.$transaction(async (tx) => {
    // 2. Cliente upsert (D8).
    //
    // KIKW12 review #1a (identity takeover, closed): this endpoint is public
    // and unauthenticated, so the `update` branch MUST NOT overwrite PII or
    // anyone who knows an existing cliente's email could rewrite their name /
    // phone / empresa and impersonate them. PII is set on `create` only; on a
    // repeat submission we reuse the existing row untouched and link the new
    // Pedido/Cotización. Proof-of-email-control for approve/cancel/tracker is
    // now enforced by the magic-link session cookie (see lib/services/
    // cotizacion-access.ts) issued by the submit handler.
    const cliente = await tx.clientes.upsert({
      where: { correo_electronico: correo },
      update: {},
      create: {
        nombre_cliente: input.cliente.nombre_cliente,
        correo_electronico: correo,
        numero_telefono: input.cliente.numero_telefono,
        empresa: input.cliente.empresa ?? null,
        // Leave `categoria` unset (→ null / "Sin categoría") for storefront
        // signups. Admins assign a tier (Black / Silver / Gold / Emprendedor /
        // Baneado) from the Clientes page once they've reviewed the customer;
        // we don't want every first-time submitter pre-classified as a tier.
      },
    });

    // 3. Resolve catalog statuses.
    const pedidoStatusPendiente = await tx.estatusPedidos.findUnique({
      where: { descripcion: "Pendiente" },
    });
    const estadoFacturaCotizacion = await tx.estadoFacturaPedido.findUnique({
      where: { descripcion: "Cotizacion" },
    });
    const cotizacionStatusPendiente = await tx.estatusCotizacion.findUnique({
      where: { descripcion: QUOTATION_STATUS.PENDIENTE },
    });

    if (!pedidoStatusPendiente || !estadoFacturaCotizacion || !cotizacionStatusPendiente) {
      throw new ConfigurationError("Catálogos de estatus incompletos — ejecuta npm run db:seed");
    }

    // 4. Create draft Pedido (no detalles yet — we need their IDs to attach variables).
    const pedido = await tx.pedidos.create({
      data: {
        id_cliente: cliente.id_cliente,
        id_sucursal: input.id_sucursal,
        id_estatus: pedidoStatusPendiente.id_estatus,
        id_estado_factura: estadoFacturaCotizacion.id_estado_factura,
        notas: input.notas ?? null,
        fecha_estimada: input.fecha_estimada ?? null,
      },
    });

    // 5. Allocate folio via Postgres sequence (atomic, concurrent-safe).
    const seqRow = await tx.$queryRaw<Array<{ nextval: bigint }>>`
      SELECT nextval('folio_seq') AS nextval
    `;
    const seq = Number(seqRow[0].nextval);
    const folio = `GD-${new Date().getFullYear()}-${String(seq).padStart(5, "0")}`;

    // 6. Create Cotización (Pendiente).
    const cotizacion = await tx.cotizaciones.create({
      data: {
        id_cliente: cliente.id_cliente,
        id_pedido: pedido.id_pedido,
        id_estatus_cotizacion: cotizacionStatusPendiente.id_estatus,
        folio,
        monto_total,
        empresa_cliente: input.cliente.empresa ?? null,
        notas: input.notas ?? null,
        fecha_fin: input.fecha_estimada ?? null,
      },
    });

    // 7. Create each DetallePedido and its VariablesCotizacion rows.
    for (const { item, precioUnitario, subtotal, formulaVariables } of pricedItems) {
      // Resolve ArchivosDisenio: create a real row when the client uploaded a
      // design file, otherwise fall back to the seed placeholder so the NOT NULL
      // FK constraint is always satisfied.
      let archivoId = placeholderArchivoId;
      if (item.disenio_key) {
        // Prefer the original filename sent by the client; fall back to the UUID
        // segment of the key only as a last resort (should never happen in practice).
        const nombre = item.disenio_nombre ?? item.disenio_key.split("/").pop() ?? item.disenio_key;
        // Truncate to 20 chars to respect ARCHIVOSDISENIO.formato VarChar(20).
        // A malformed or crafted extension longer than 20 chars would otherwise
        // cause a DB transaction rollback with a 500 error.
        const ext = (nombre.includes(".") ? nombre.split(".").pop()!.toLowerCase() : "bin").slice(
          0,
          20
        );
        const archivo = await tx.archivosDisenio.create({
          data: {
            nombre_archivo: nombre,
            // Store the bucket key as url_archivo; the admin UI / PDF generator
            // can build a signed download URL from it on demand.
            url_archivo: item.disenio_key,
            formato: ext,
          },
        });
        archivoId = archivo.id_archivo;
      }

      const detalle = await tx.detallePedido.create({
        data: {
          id_pedido: pedido.id_pedido,
          id_servicio: item.id_servicio,
          id_material: item.id_material,
          id_archivo: archivoId,
          cantidad: item.cantidad,
          precio_unitario: precioUnitario,
          subtotal,
          responsable_recoleccion: input.cliente.nombre_cliente,
          notas: item.notas ?? null,
        },
      });

      // Copilot review #2: source of truth is the formula's variable definitions,
      // not the client payload. Every formula variable gets a VariablesCotizacion
      // row (using the submitted value, or the default when missing) so the audit
      // trail is complete. Unknown names from the client are rejected loudly
      // rather than silently dropped — that catches client-side typos.
      const submittedByName = new Map(item.variables.map((v) => [v.nombre_variable, v.valor]));
      const knownNames = new Set(formulaVariables.map((fv) => fv.nombre_variable));
      for (const submitted of item.variables) {
        if (!knownNames.has(submitted.nombre_variable)) {
          throw new ValidationError(
            `Variable desconocida "${submitted.nombre_variable}" para servicio ${item.id_servicio}`
          );
        }
      }

      const variableRows = formulaVariables.map((fv) => {
        const submitted = submittedByName.get(fv.nombre_variable);
        const valor =
          submitted !== undefined
            ? submitted
            : fv.valor_default !== null
              ? Number(fv.valor_default)
              : null;
        if (valor === null) {
          throw new ValidationError(`La variable "${fv.nombre_variable}" requiere un valor`);
        }
        return {
          id_cotizacion: cotizacion.id_cotizacion,
          id_detalle: detalle.id_detalle,
          id_variable: fv.id_variable,
          valor,
          id_usuario_asigno: sistemaUserId,
        };
      });

      if (variableRows.length > 0) {
        await tx.variablesCotizacion.createMany({ data: variableRows });
      }
    }

    // 8. History entry, actor_tipo="Cliente" (per HistorialEstadosCotizacion schema added by ST-08).
    await tx.historialEstadosCotizacion.create({
      data: {
        id_cotizacion: cotizacion.id_cotizacion,
        id_cliente: cliente.id_cliente,
        id_estado_anterior: null,
        id_estado_nuevo: cotizacionStatusPendiente.id_estatus,
        actor_tipo: "Cliente",
      },
    });

    return {
      folio,
      monto_total,
      id_cotizacion: cotizacion.id_cotizacion,
      // KIKW12 review #2: lookup URL no longer carries the email as a bearer
      // credential. The cliente reaches the tracker by clicking the magic link
      // we email them (issued out-of-band by the submit route handler) — that
      // link consumes a single-use token and sets a JWT session cookie.
      lookup_url: `/tienda/cotizacion/confirmacion?folio=${encodeURIComponent(folio)}`,
    };
  });
}

/**
 * PR #28 — Fetches the complete context required to generate a Work Order PDF.
 * Includes the Quotation, its Line Items (Specs), Branch Data, and Client Data.
 */
export async function getFullQuotationContext(id: number) {
  const quotation = await prisma.cotizaciones.findUnique({
    where: { id_cotizacion: id },
    include: {
      cliente: true,
      estatus: true,
      pedido: {
        include: {
          sucursal: true,
          detalles: {
            include: {
              servicio: true,
              material: true,
              archivo: true,
            },
          },
        },
      },
    },
  });

  if (!quotation) {
    throw new NotFoundError("Quotation not found");
  }

  // Ensure the quotation is validated and approved (status must be 'Aprobada')
  if (quotation.estatus.descripcion !== QUOTATION_STATUS.APROBADA) {
    throw new ConflictError(
      `No se puede generar la orden de trabajo. La cotización debe estar en estado 'Aprobada' (estado actual: '${quotation.estatus.descripcion}').`
    );
  }

  // Ensure contact data is present (Cliente)
  if (!quotation.cliente || !quotation.cliente.nombre_cliente) {
    throw new DataInconsistencyError("Client contact data is missing or incomplete.");
  }

  // Ensure we have specs
  const specs = quotation.pedido?.detalles || [];
  if (specs.length === 0) {
    throw new DataInconsistencyError(
      "Quotation has no line items (specs) to generate a Work Order."
    );
  }

  // Fetch branch data. If not tied to an order yet, fallback to a default branch if necessary.
  // For now, assuming standard process dictates an order exists when Work Order is generated.
  const branch = quotation.pedido?.sucursal;
  if (!branch) {
    throw new DataInconsistencyError("Branch data is missing for this quotation's order.");
  }

  return {
    quotation,
    client: quotation.cliente,
    specs,
    branch,
  };
}
