import type { NextRequest } from "next/server";
import { z } from "zod";

import { CotizacionIdParams } from "@/lib/schemas/cotizaciones";
import { SESSION_COOKIE_NAME, verifySessionFor } from "@/lib/services/cotizacion-access";
import { cancelQuotationByClient } from "@/lib/services/cotizaciones";
import { ok } from "@/lib/utils/api";
import { handleError, ForbiddenError } from "@/lib/utils/errors";

type Params = { id: string };

const CancelSchema = z.object({
  reason: z.string().optional(),
});

/**
 * POST /api/cotizaciones/[id]/cancel
 *
 * KIKW12 review #1b: gated by the magic-link session cookie (see approve route
 * for the rationale). The session's id_cotizacion claim must match this route's
 * id exactly.
 */
export async function POST(req: NextRequest, ctx: { params: Promise<Params> }) {
  try {
    const { id } = CotizacionIdParams.parse(await ctx.params);
    const body = CancelSchema.parse(await req.json());

    const session = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!session || !(await verifySessionFor(session, id))) {
      throw new ForbiddenError("Acceso denegado");
    }

    const result = await cancelQuotationByClient(id, body.reason);
    return ok(result);
  } catch (err) {
    return handleError(err);
  }
}
