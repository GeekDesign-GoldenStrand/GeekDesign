<<<<<<< HEAD
import type { Cotizaciones } from "@prisma/client";
=======
import type {
  Cotizaciones,
  HistorialEstadosCotizacion,
  CotizacionesRechazadas,
} from "@prisma/client";
>>>>>>> 28c06747318fab03b786c4ea4bd7f90353bd972d
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/client";
import type { CreateCotizacionInput, UpdateCotizacionInput } from "@/lib/schemas/cotizaciones";
import { ConfigurationError } from "@/lib/utils/errors";

<<<<<<< HEAD
// Centralized catalog of quotation statuses.
// Using constants avoids scattered "magic strings" and makes refactoring safer.
export const QUOTATION_STATUS = {
  VALIDADA: "Validada",
  RECHAZADA: "Rechazada",
  APROBADA: "Aprobada",
  EN_REVISION: "En_revision",
} as const;

export type QuotationStatus = (typeof QUOTATION_STATUS)[keyof typeof QUOTATION_STATUS];

type CotizacionWithRelations = Prisma.CotizacionesGetPayload<{
  include: {
    cliente: true;
    estatus: true;
  };
}>;
=======
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
>>>>>>> 28c06747318fab03b786c4ea4bd7f90353bd972d

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
<<<<<<< HEAD
      include: { cliente: true, estatus: true },
      orderBy: { id_cotizacion: "asc" },
=======
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
>>>>>>> 28c06747318fab03b786c4ea4bd7f90353bd972d
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
  // Placeholder until implemented.
  // Throwing explicit error avoids silent failures.
  void data;
  throw new Error("Not implemented");
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
  // Fetch current quotation to record previous status in history.
  const currentQuotation = await prisma.cotizaciones.findUnique({
    where: { id_cotizacion: quotationId },
  });
  if (!currentQuotation) {
    throw new Error("Quotation not found");
  }

  const newStatusId = await getQuotationStatusId(targetStatus);

  // Transaction ensures atomicity: if either update or history fails,
  // neither change is committed. This guarantees traceability.
<<<<<<< HEAD
  const [updatedQuotation] = await prisma.$transaction([
=======
  const isRejected = targetStatus === QUOTATION_STATUS.RECHAZADA;

  const operations: (
    | Prisma.PrismaPromise<Cotizaciones>
    | Prisma.PrismaPromise<HistorialEstadosCotizacion>
    | Prisma.PrismaPromise<CotizacionesRechazadas>
    | Prisma.PrismaPromise<Prisma.BatchPayload>
  )[] = [
>>>>>>> 28c06747318fab03b786c4ea4bd7f90353bd972d
    prisma.cotizaciones.update({
      where: { id_cotizacion: quotationId },
      data: { id_estatus_cotizacion: newStatusId },
    }),
<<<<<<< HEAD
=======

>>>>>>> 28c06747318fab03b786c4ea4bd7f90353bd972d
    prisma.historialEstadosCotizacion.create({
      data: {
        id_cotizacion: quotationId,
        id_usuario: userId,
        id_estado_anterior: currentQuotation.id_estatus_cotizacion,
        id_estado_nuevo: newStatusId,
        fecha_cambio: new Date(),
      },
    }),
<<<<<<< HEAD
  ]);
=======
  ];

  // If quotation becomes rejected,
  // register it in rejected quotations table.
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

  // If quotation is no longer rejected,
  // remove it from rejected quotations table.
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
>>>>>>> 28c06747318fab03b786c4ea4bd7f90353bd972d

  return updatedQuotation;
}
