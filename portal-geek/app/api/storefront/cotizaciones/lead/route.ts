import type { NextRequest } from "next/server";

import { SolicitarLeadSchema } from "@/lib/schemas/cotizaciones";
import { solicitarLead } from "@/lib/services/cotizaciones";
import { created } from "@/lib/utils/api";
import { handleError, RateLimitError } from "@/lib/utils/errors";
import { peekRateLimit, recordAttempt } from "@/lib/utils/rate-limit";
import { getClientIp } from "@/lib/utils/request-ip";

// Mirror the cart-submit endpoint: rate-limit this public DB-write per IP so
// the multi-row lead transaction can't be abused as a DoS vector. Only
// *successful* submits count — a user fixing a 422 must never get locked out.
const SUBMIT_RATE_LIMIT = { maxAttempts: 10, windowMs: 15 * 60_000 };

// Public storefront endpoint — cliente submits a guided solicitud (ST-10/11/12).
// No auth, no cart. Creates a lead-shaped Cotización (Pendiente) and returns
// the folio so the cliente has a reference.
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rateKey = `storefront:cotizaciones:lead:${ip}`;
    const { allowed, retryAfterMs } = peekRateLimit(rateKey, SUBMIT_RATE_LIMIT);
    if (!allowed) {
      throw RateLimitError.fromMs(retryAfterMs);
    }

    const body = SolicitarLeadSchema.parse(await req.json());
    const result = await solicitarLead(body);
    recordAttempt(rateKey, SUBMIT_RATE_LIMIT);

    return created(result);
  } catch (err) {
    return handleError(err);
  }
}
