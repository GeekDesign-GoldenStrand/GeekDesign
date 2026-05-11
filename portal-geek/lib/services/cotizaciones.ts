import type {
  Cotizaciones,
  HistorialEstadosCotizacion,
  CotizacionesRechazadas,
} from "@prisma/client";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/client";
import type { CreateCotizacionInput, UpdateCotizacionInput } from "@/lib/schemas/cotizaciones";
import { ConfigurationError } from "@/lib/utils/errors";

type CotizacionWithRelations = {
  id_cotizacion: number;
  fecha_creacion: Date;
  monto_total: Prisma.Decimal;
  empresa_cliente: string | null;
  folio: string | null;
  fecha_fin: Date | null;
  fecha_aprobacion: Date | null;
  cliente: {
    nombre_cliente: string;
    empresa: string | null;
  };
  estatus: {
    descripcion: string;
  };
};

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
  filters?: { cliente?: string; empresa?: string; estatus?: string[]; search?: string }
): Promise<{ items: CotizacionWithRelations[]; total: number }> {
  const skip = (page - 1) * pageSize;

  const where: Prisma.CotizacionesWhereInput = {};

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
      select: {
        id_cotizacion: true,
        fecha_creacion: true,
        monto_total: true,
        empresa_cliente: true,
        folio: true,
        fecha_fin: true,
        fecha_aprobacion: true,
        cliente: {
          select: {
            nombre_cliente: true,
            empresa: true,
          },
        },
        estatus: {
          select: {
            descripcion: true,
          },
        },
      },
    }),
    prisma.cotizaciones.count({ where }),
  ]);

  return { items, total };
}

export async function getCotizacion(id: number): Promise<Cotizaciones | null> {
  return prisma.cotizaciones.findUnique({
    where: { id_cotizacion: id },
    include: {
      cliente: true,
      estatus: true,
    },
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
  const isRejected = targetStatus === QUOTATION_STATUS.RECHAZADA;

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
      },
    }),
  ];

  // Register rejected quotations.
  if (isRejected) {
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
  }

  // Remove from rejected table if no longer rejected.
  if (!isRejected) {
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
