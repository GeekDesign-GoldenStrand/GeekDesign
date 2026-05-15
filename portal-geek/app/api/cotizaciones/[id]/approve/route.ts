import type { NextRequest } from "next/server";

import { CotizacionIdParams } from "@/lib/schemas/cotizaciones";
import { approveQuotation } from "@/lib/services/cotizaciones";
import { created } from "@/lib/utils/api";
import { handleError, ValidationError } from "@/lib/utils/errors";

type Params = { id: string };

/**
 * POST /api/cotizaciones/[id]/approve
 * Publicly accessible endpoint for clients to approve their quotation.
 * Automatically triggers the creation of a Pedido (Order).
 */
export async function POST(req: NextRequest, ctx: { params: Promise<Params> }) {
  try {
    const { id } = CotizacionIdParams.parse(await ctx.params);
    const email = req.headers.get("X-Client-Email");

    if (!email) {
      return handleError(new ValidationError("Client email is required for this action"));
    }

    // Approve and create Pedido. Traceability now uses id_cliente automatically.
    // Service now verifies the email matches the quotation's client.
    const result = await approveQuotation(id, email);

    return created(result);
  } catch (err) {
    return handleError(err);
  }
}
