import { NextResponse } from "next/server";

import { withRoleParams } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/client";
import { CotizacionIdParams } from "@/lib/schemas/cotizaciones";

type Params = { id: string };

// PATCH /api/cotizaciones/[id]/validar
export const PATCH = withRoleParams<{ id: string }>(
  ["Direccion"],
  async (_req, ctx, session) =>  {
  try {
    // Validate parameters with Zod
    const { id } = CotizacionIdParams.parse(ctx.params);
    const quotationId = id;

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
      include: { cliente: true, pedido: true },
    });

    // Save the change in history with the real authenticated user
    await prisma.historialEstadosCotizacion.create({
      data: {
        id_cotizacion: quotationId,
        id_usuario: session.id,
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
});

// Helper function to get status ID by description
async function getQuotationStatusId(description: string) {
  const status = await prisma.estatusCotizacion.findUnique({
    where: { descripcion: description },
  });
  if (!status) throw new Error(`Quotation status '${description}' not found`);
  return status.id_estatus;
}
