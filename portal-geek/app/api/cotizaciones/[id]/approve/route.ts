import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

import { prisma } from "@/lib/db/client";
import { CotizacionIdParams } from "@/lib/schemas/cotizaciones";
import { approveQuotation } from "@/lib/services/cotizaciones";
import { created } from "@/lib/utils/api";
import { handleError, ValidationError, ForbiddenError, NotFoundError } from "@/lib/utils/errors";

type Params = { id: string };

/**
 * POST /api/cotizaciones/[id]/approve
 * Publicly accessible endpoint for clients to approve their quotation.
 * Automatically triggers the creation of a Pedido (Order).
 */
export async function POST(req: NextRequest, ctx: { params: Promise<Params> }) {
  try {
    const { id } = CotizacionIdParams.parse(await ctx.params);
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

    // Approve and create Pedido. Traceability now uses id_cliente automatically.
    // Service now verifies the email matches the quotation's client.
    const result = await approveQuotation(id, email);

    return created(result);
  } catch (err) {
    return handleError(err);
  }
}
