import type { NextRequest } from "next/server";

import { CotizacionIdParams } from "@/lib/schemas/cotizaciones";
import { SESSION_COOKIE_NAME, verifySessionFor } from "@/lib/services/cotizacion-access";
import { approveQuotation } from "@/lib/services/cotizaciones";
import { created } from "@/lib/utils/api";
import { handleError, ForbiddenError } from "@/lib/utils/errors";

type Params = { id: string };

/**
 * POST /api/cotizaciones/[id]/approve
 *
 * KIKW12 review #1b: gated by the magic-link session cookie. The cookie's
 * id_cotizacion claim must match the route param exactly — a session for
 * cotización A cannot approve cotización B. Replaces the old plaintext
 * client_email/client_folio cookie pair that the cliente could spoof.
 */
export async function POST(req: NextRequest, ctx: { params: Promise<Params> }) {
  try {
    const { id } = CotizacionIdParams.parse(await ctx.params);

    const session = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!session || !(await verifySessionFor(session, id))) {
      throw new ForbiddenError("Acceso denegado");
    }

    const result = await approveQuotation(id);
    return created(result);
  } catch (err) {
    return handleError(err);
  }
}
