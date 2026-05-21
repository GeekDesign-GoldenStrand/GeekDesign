import type {
  Cotizaciones,
  HistorialEstadosCotizacion,
  CotizacionesRechazadas,
} from "@prisma/client";
import type { Prisma } from "@prisma/client";

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
  NotFoundError,
  ValidationError,
  DataInconsistencyError,
} from "@/lib/utils/errors";

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
        },
      },
    },
  },
} as const;

export type CotizacionWithRelations = Prisma.CotizacionesGetPayload<{
  include: typeof INCLUDE_CONFIG;
}>;

// Copilot review #1: emails must be normalized before any Postgres @unique
// lookup or comparison. Postgres unique indexes are case-sensitive, and the
// approve/cancel handlers compare with `.toLowerCase()` on a `.trim()`-less
// header — keep both sides consistent by routing every email through this.
const normalizeEmail = (e: string) => e.trim().toLowerCase();

// Centralized catalog of quotation statuses.
// Using constants avoids scattered "magic strings" and makes refactoring safer.
export const QUOTATION_STATUS = {
  PENDIENTE: "Pendiente",
  VALIDADA: "Validada",
  RECHAZADA: "Rechazada",
  APROBADA: "Aprobada",
  CANCELADA: "Cancelada",
} as const;

export type QuotationStatus = (typeof QUOTATION_STATUS)[keyof typeof QUOTATION_STATUS];

export async function listCotizaciones(
  page: number,
  pageSize: number,
  filters?: {
    cliente?: string;
    empresa?: string;
    estatus?: string[];
    search?: string;
    includeFinished?: boolean;
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

  if (filters?.cliente) {
    where.cliente = { nombre_cliente: { contains: filters.cliente, mode: "insensitive" } };
  }

  if (filters?.estatus && filters.estatus.length > 0) {
    where.estatus = { descripcion: { in: filters.estatus } };
  }

  const orConditions: Prisma.CotizacionesWhereInput[] = [];

  if (filters?.empresa) {
    orConditions.push(
      { empresa_cliente: { contains: filters.empresa, mode: "insensitive" } },
      { cliente: { empresa: { contains: filters.empresa, mode: "insensitive" } } }
    );
  }

  if (filters?.search) {
    orConditions.push(
      {
        cliente: {
          nombre_cliente: {
            contains: filters.search,
            mode: "insensitive",
          },
        },
      },
      {
        empresa_cliente: {
          contains: filters.search,
          mode: "insensitive",
        },
      },
      {
        estatus: {
          descripcion: {
            contains: filters.search,
            mode: "insensitive",
          },
        },
      }
    );
  }

  if (orConditions.length > 0) {
    where.OR = orConditions;
  }

  const [items, total] = await Promise.all([
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

export async function getCotizacion(id: number): Promise<CotizacionWithRelations | null> {
  return prisma.cotizaciones.findUnique({
    where: { id_cotizacion: id },
    include: INCLUDE_CONFIG,
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
  void id;
  void data;
  throw new Error("Not implemented");
}

export async function deleteCotizacion(id: number): Promise<void> {
  // Placeholder until implemented.
  void id;
  throw new Error("Not implemented");
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

  const currentStatus = currentQuotation.estatus.descripcion as QuotationStatus;

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
        categoria: "Emprendedor",
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
      },
    });

    // 7. Create each DetallePedido and its VariablesCotizacion rows.
    for (const { item, precioUnitario, subtotal, formulaVariables } of pricedItems) {
      const detalle = await tx.detallePedido.create({
        data: {
          id_pedido: pedido.id_pedido,
          id_servicio: item.id_servicio,
          id_material: item.id_material,
          id_archivo: placeholderArchivoId,
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
