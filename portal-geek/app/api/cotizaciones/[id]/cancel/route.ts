import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db/client";
import { CotizacionIdParams } from "@/lib/schemas/cotizaciones";
import { cancelQuotationByClient } from "@/lib/services/cotizaciones";
import { ok } from "@/lib/utils/api";
import { handleError, ValidationError, ForbiddenError, NotFoundError } from "@/lib/utils/errors";

type Params = { id: string };

const CancelSchema = z.object({
  reason: z.string().optional(),
});

/**
 * POST /api/cotizaciones/[id]/cancel
 * Publicly accessible endpoint for clients to cancel their quotation.
 */
export async function POST(req: NextRequest, ctx: { params: Promise<Params> }) {
  try {
    const { id } = CotizacionIdParams.parse(await ctx.params);
    const body = CancelSchema.parse(await req.json());

    let cookieEmail: string | undefined;
    let cookieFolio: string | undefined;
    try {
      const cookieStore = await cookies();
      cookieEmail = cookieStore.get("client_email")?.value;
      cookieFolio = cookieStore.get("client_folio")?.value;
    } catch {
      // In testing environments where Next.js context is not present, ignore cookies
    }

    const email = cookieEmail || req.headers.get("X-Client-Email");
    const folio = cookieFolio || req.headers.get("X-Client-Folio") || String(id);

    if (!email || !folio) {
      return handleError(new ValidationError("Acceso denegado."));
    }

    // Retrieve quotation to validate folio matches the secure session cookie
    const quotation = await prisma.cotizaciones.findUnique({
      where: { id_cotizacion: id },
    });

    if (!quotation) {
      return handleError(new NotFoundError("Acceso denegado."));
    }

    const folioMatch =
      folio.trim().toLowerCase() === quotation.folio?.trim().toLowerCase() ||
      folio.trim() === String(quotation.id_cotizacion);

    if (!folioMatch) {
      return handleError(new ForbiddenError("Acceso denegado."));
    }

    // Cancellation uses id_cliente for history traceability when triggered by client.
    // Service now verifies the email matches the quotation's client.
    const result = await cancelQuotationByClient(id, email, body.reason);

    return ok(result);
  } catch (err) {
    return handleError(err);
  }
}
