import type { NextRequest } from "next/server";
import { z } from "zod";

import { CotizacionIdParams } from "@/lib/schemas/cotizaciones";
import { rejectQuotation } from "@/lib/services/cotizaciones";
import { ok } from "@/lib/utils/api";
import { handleError } from "@/lib/utils/errors";

type Params = { id: string };

const RejectSchema = z.object({
  reason: z.string().optional(),
});

/**
 * POST /api/cotizaciones/[id]/reject
 * Publicly accessible endpoint for clients to reject a quotation.
 */
export async function POST(req: NextRequest, ctx: { params: Promise<Params> }) {
  try {
    const { id } = CotizacionIdParams.parse(await ctx.params);
    const body = RejectSchema.parse(await req.json());

    // Rejection uses System User (ID 1) for history when triggered by client.
    const result = await rejectQuotation(id, 1, body.reason);

    return ok(result);
  } catch (err) {
    return handleError(err);
  }
}
