import { withRoleParams } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/client";
import { CotizacionIdParams } from "@/lib/schemas/cotizaciones";
import { getQuotationStatusId } from "@/lib/services/cotizaciones";
import { ok } from "@/lib/utils/api";
import { NotFoundError, handleError } from "@/lib/utils/errors";

// PATCH /api/cotizaciones/[id]/validar
export const PATCH = withRoleParams<{ id: string }>(["Direccion"], async (_req, ctx, session) => {
  try {
    // Validate parameters with Zod
    const { id } = CotizacionIdParams.parse(ctx.params);
    const quotationId = id;

    // Find current quotation to know its previous status
    const currentQuotation = await prisma.cotizaciones.findUnique({
      where: { id_cotizacion: quotationId },
    });
    if (!currentQuotation) {
      return handleError(new NotFoundError("Cotización no encontrada"));
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
    return ok(validatedQuotation);
  } catch (error) {
    return handleError(error);
  }
});
