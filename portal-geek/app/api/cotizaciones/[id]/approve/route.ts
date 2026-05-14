import type { NextRequest } from "next/server";

import { CotizacionIdParams } from "@/lib/schemas/cotizaciones";
import { approveQuotation } from "@/lib/services/cotizaciones";
import { created } from "@/lib/utils/api";
import { handleError } from "@/lib/utils/errors";

type Params = { id: string };

/**
 * POST /api/cotizaciones/[id]/approve
 * Publicly accessible endpoint for clients to approve their quotation.
 * Automatically triggers the creation of a Pedido (Order).
 */
export async function POST(_req: NextRequest, ctx: { params: Promise<Params> }) {
  try {
    const { id } = CotizacionIdParams.parse(await ctx.params);

    // Approve and create Pedido. Uses System User (ID 1) for history.
    const result = await approveQuotation(id, 1);

    return created(result);
  } catch (err) {
    return handleError(err);
  }
}
