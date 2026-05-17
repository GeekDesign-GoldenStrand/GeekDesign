import type {
  Cotizaciones,
  HistorialEstadosCotizacion,
  CotizacionesRechazadas,
} from "@prisma/client";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/client";
import type { CreateCotizacionInput, UpdateCotizacionInput } from "@/lib/schemas/cotizaciones";
import {
  ConfigurationError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  DataInconsistencyError,
} from "@/lib/utils/errors";
import { generateWorkOrderPDF } from "@/lib/utils/pdf-work-order";

/**
 * Common include configuration for quotations to ensure consistent typing.
 */
const INCLUDE_CONFIG = {
  cliente: true,
  estatus: true,
  variablesCotizacion: {
    include: {
      formula: {
        include: {
          servicio: true,
        },
      },
    },
  },
  pedido: {
    include: {
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
 * Approves a quotation and automatically creates a corresponding Order (Pedido).
 * This is an atomic operation to ensure data consistency between Sales and Production.
 */
export async function approveQuotation(quotationId: number, providedEmail: string) {
  return prisma.$transaction(async (tx) => {
    // 1. Fetch quotation with details (include client for email verification)
    const quotation = await tx.cotizaciones.findUnique({
      where: { id_cotizacion: quotationId },
      include: {
        estatus: true,
        pedido: true,
        cliente: true,
      },
    });

    if (!quotation) throw new NotFoundError("Quotation not found");

    // Security Verification: Ensure the provided email matches the quotation's client
    if (providedEmail.toLowerCase() !== quotation.cliente.correo_electronico.toLowerCase()) {
      throw new ForbiddenError("You are not authorized to approve this quotation");
    }
    if (quotation.estatus.descripcion !== QUOTATION_STATUS.VALIDADA) {
      throw new ConflictError("Only validated quotations can be approved");
    }

    if (!quotation.id_pedido) {
      throw new ValidationError("Cannot approve a quotation without validated line items");
    }

    // 2. Resolve necessary IDs
    const approvedStatus = await tx.estatusCotizacion.findUnique({
      where: { descripcion: QUOTATION_STATUS.APROBADA },
    });
    const initialPedidoStatus = await tx.estatusPedidos.findUnique({
      where: { descripcion: "Pendiente" },
    });

    if (!approvedStatus || !initialPedidoStatus) {
      throw new Error("Required status catalogs not found");
    }

    // 3. Fetch current details to promote (filter out rejected items)
    const currentDetails = await tx.detallePedido.findMany({
      where: { id_pedido: quotation.id_pedido || 0 },
    });

    const activeDetails = currentDetails.filter((d) => {
      const notas = d.notas || "";
      return !notas.includes("[ESTADO:rechazado]");
    });

    const branchId = quotation.pedido?.id_sucursal;
    if (!branchId) {
      throw new ValidationError(
        "No se pudo determinar la sucursal para este pedido. Por favor, contacta a soporte."
      );
    }

    // 4. Create the Pedido (Order)
    // Starts with 0% progress as requested.
    const pedido = await tx.pedidos.create({
      data: {
        id_cliente: quotation.id_cliente,
        id_sucursal: branchId,
        id_estatus: initialPedidoStatus.id_estatus,
        fecha_creacion: new Date(),
        factura: false,
        notas: quotation.notas,
        // Promote the active items to the new pedido
        detalles: {
          create: activeDetails.map((d) => ({
            servicio: { connect: { id_servicio: d.id_servicio } },
            material: { connect: { id_material: d.id_material } },
            archivo: { connect: { id_archivo: d.id_archivo } },
            opciones_seleccionadas: d.opciones_seleccionadas || {},
            cantidad: d.cantidad,
            responsable_recoleccion: d.responsable_recoleccion,
            precio_unitario: d.precio_unitario,
            subtotal: d.subtotal,
            notas: d.notas,
            ancho_cm: d.ancho_cm,
            alto_cm: d.alto_cm,
            grosor_cm: d.grosor_cm,
            color: d.color,
          })),
        },
      },
    });

    // 5. Update Quotation and Cleanup Draft Pedido
    const oldPedidoId = quotation.id_pedido;

    const updatedQuotation = await tx.cotizaciones.update({
      where: { id_cotizacion: quotationId },
      data: {
        id_estatus_cotizacion: approvedStatus.id_estatus,
        id_pedido: pedido.id_pedido,
        fecha_aprobacion: new Date(),
      },
    });

    // Cleanup the old draft pedido (validation artifacts)
    if (oldPedidoId) {
      await tx.historialEstadosPedidos.deleteMany({ where: { id_pedido: oldPedidoId } });
      await tx.detallePedido.deleteMany({ where: { id_pedido: oldPedidoId } });
      await tx.pedidos.delete({ where: { id_pedido: oldPedidoId } });
    }

    // 6. Log status history
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
export async function cancelQuotationByClient(
  quotationId: number,
  providedEmail: string,
  reason?: string
) {
  return prisma.$transaction(async (tx) => {
    const quotation = await tx.cotizaciones.findUnique({
      where: { id_cotizacion: quotationId },
      include: { estatus: true, cliente: true },
    });

    if (!quotation) throw new NotFoundError("Quotation not found");

    // Security Verification: Ensure the provided email matches the quotation's client
    if (providedEmail.toLowerCase() !== quotation.cliente.correo_electronico.toLowerCase()) {
      throw new ForbiddenError("You are not authorized to cancel this quotation");
    }

    if (
      !([QUOTATION_STATUS.PENDIENTE, QUOTATION_STATUS.VALIDADA] as string[]).includes(
        quotation.estatus.descripcion
      )
    ) {
      throw new ConflictError(
        `Cannot cancel a quotation in '${quotation.estatus.descripcion}' status`
      );
    }

    const cancelledStatus = await tx.estatusCotizacion.findUnique({
      where: { descripcion: QUOTATION_STATUS.CANCELADA },
    });

    if (!cancelledStatus) throw new Error("Cancelled status not found");

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
        id_cliente: quotation.id_cliente,
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
 * Fetches the complete context required to generate a Work Order PDF.
 * This includes the Quotation, its Line Items (Specs), Branch Data, and Client Data.
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
    throw new DataInconsistencyError("Quotation has no line items (specs) to generate a Work Order.");
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

/**
 * Prepares and generates the Work Order PDF document.
 */
export async function prepareWorkOrderDocument(id: number) {
  const context = await getFullQuotationContext(id);
  
  // Call the external service to generate the PDF stream/buffer
  const pdfBuffer = await generateWorkOrderPDF(context);
  
  return pdfBuffer;
}
