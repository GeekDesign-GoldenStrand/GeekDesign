import { withRoleParams } from "@/lib/auth/guards";
import { CotizacionIdParams, UpdateCotizacionSchema } from "@/lib/schemas/cotizaciones";
import { getCotizacion, updateCotizacion, deleteCotizacion } from "@/lib/services/cotizaciones";
import { ok, noContent } from "@/lib/utils/api";
import { handleError } from "@/lib/utils/errors";

type Params = { id: string };

export const GET = withRoleParams<Params>(["Direccion"], async (_req, ctx) => {
  try {
    const { id } = CotizacionIdParams.parse(await ctx.params);
    return ok(await getCotizacion(id));
  } catch (err) {
    return handleError(err);
  }
});

export const PUT = withRoleParams<Params>(["Direccion"], async (req, ctx) => {
  try {
    const { id } = CotizacionIdParams.parse(await ctx.params);
    const body = UpdateCotizacionSchema.parse(await req.json());
    return ok(await updateCotizacion(id, body));
  } catch (err) {
    return handleError(err);
  }
});

export const DELETE = withRoleParams<Params>(["Direccion"], async (_req, ctx) => {
  try {
    const { id } = CotizacionIdParams.parse(await ctx.params);
    await deleteCotizacion(id);
    return noContent();
  } catch (err) {
    return handleError(err);
  }
});

/* Esto es lo que antes había en rechazar cotización

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";


// PATCH /api/cotizaciones/[id]/rechazar
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Extract quotation ID from dynamic route parameter
    const { id } = await params;
    const quotationId = parseInt(id, 10);


    // Find current quotation to know its previous status
    const currentQuotation = await prisma.cotizaciones.findUnique({
      where: { id_cotizacion: quotationId },
    });
    if (!currentQuotation) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }


    // Get the ID of the "Rechazada" status from EstatusCotizacion table
    const newStatusId = await getQuotationStatusId("Rechazada");


    // Update quotation status to "Rechazada"
    const rejectedQuotation = await prisma.cotizaciones.update({
      where: { id_cotizacion: quotationId },
      data: {
        estatus: { connect: { id_estatus: newStatusId } }, // update via relation
      },
      include: { cliente: true, pedido: true },
    });


    // Save the change in history (temporary user id = 1)
    await prisma.historialEstadosCotizacion.create({
      data: {
        id_cotizacion: quotationId,
        id_usuario: 1, // will be replaced with real user when auth is implemented
        id_estado_anterior: currentQuotation.id_estatus_cotizacion,
        id_estado_nuevo: newStatusId,
      },
    });


    // Return updated quotation as JSON
    return NextResponse.json(rejectedQuotation);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to reject quotation" }, { status: 500 });
  }
}


// Helper function to get status ID by description
async function getQuotationStatusId(description: string) {
  const status = await prisma.estatusCotizacion.findUnique({ where: { descripcion: description } });
  if (!status) throw new Error(`Quotation status '${description}' not found`);
  return status.id_estatus;
}
*/

/* Esto es lo que antes había en validar cotización

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";


// PATCH /api/cotizaciones/[id]/validar
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Extract quotation ID from dynamic route parameter
    const { id } = await params;
    const quotationId = parseInt(id, 10);


    // Find current quotation to know its previous status
    const currentQuotation = await prisma.cotizaciones.findUnique({
      where: { id_cotizacion: quotationId },
    });
    if (!currentQuotation) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }


    // Get the ID of the "Validada" status from EstatusCotizacion table
    const newStatusId = await getQuotationStatusId("Validada");


    // Update quotation status to "Validada"
    const validatedQuotation = await prisma.cotizaciones.update({
      where: { id_cotizacion: quotationId },
      data: { id_estatus_cotizacion: newStatusId },
      include: { cliente: true, pedido: true }, // include relations for richer response
    });


    // Save change in history (temporary user id = 1)
    await prisma.historialEstadosCotizacion.create({
      data: {
        id_cotizacion: quotationId,
        id_usuario: 1, // will be replaced with real user when auth is implemented
        id_estado_anterior: currentQuotation.id_estatus_cotizacion,
        id_estado_nuevo: newStatusId,
      },
    });


    // Return updated quotation as JSON
    return NextResponse.json(validatedQuotation);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to validate quotation" }, { status: 500 });
  }
}


// Helper function to get status ID by description
async function getQuotationStatusId(description: string) {
  const status = await prisma.estatusCotizacion.findUnique({ where: { descripcion: description } });
  if (!status) throw new Error(`Quotation status '${description}' not found`);
  return status.id_estatus;
}

*/