import type { NextRequest } from "next/server";
import { z } from "zod";

import { CotizacionIdParams } from "@/lib/schemas/cotizaciones";
import { cancelQuotationByClient } from "@/lib/services/cotizaciones";
import { ok } from "@/lib/utils/api";
import { handleError } from "@/lib/utils/errors";

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

    // Cancellation uses id_cliente for history traceability when triggered by client.
    const result = await cancelQuotationByClient(id, body.reason);

    return ok(result);
  } catch (err) {
    return handleError(err);
  }
}
