import type { NextRequest } from "next/server";
import { z } from "zod";

import { CotizacionIdParams } from "@/lib/schemas/cotizaciones";
import { cancelQuotationByClient } from "@/lib/services/cotizaciones";
import { ok } from "@/lib/utils/api";
import { handleError, ValidationError } from "@/lib/utils/errors";

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

    const email = req.headers.get("X-Client-Email");

    if (!email) {
      return handleError(new ValidationError("Client email is required for this action"));
    }

    // Cancellation uses id_cliente for history traceability when triggered by client.
    // Service now verifies the email matches the quotation's client.
    const result = await cancelQuotationByClient(id, email, body.reason);

    return ok(result);
  } catch (err) {
    return handleError(err);
  }
}
