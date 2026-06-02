import type { NextRequest } from "next/server";

import { SolicitarCotizacionSchema } from "@/lib/schemas/cotizaciones";
import { issueAccessToken } from "@/lib/services/cotizacion-access";
import { createCotizacionFromCart } from "@/lib/services/cotizaciones";
import { created } from "@/lib/utils/api";
import { handleError, RateLimitError } from "@/lib/utils/errors";
import { peekRateLimit, recordAttempt } from "@/lib/utils/rate-limit";
import { getClientIp } from "@/lib/utils/request-ip";
import { assertSameOrigin } from "@/lib/utils/same-origin";

// KIKW12 review #3: rate-limit public DB-write endpoint per IP. Submitting a
// cotización runs a multi-row transaction (Cliente upsert + Pedido + N×Detalle
// + Cotización + N×VariablesCotizacion + history) — abuse becomes a DoS vector.
// Only *successful* submits count: the expensive transaction is what we bound,
// and a user fixing a validation error (422) must never get locked out.
const SUBMIT_RATE_LIMIT = { maxAttempts: 10, windowMs: 15 * 60_000 };

// Public storefront endpoint — cliente submits cart (no auth).
// Server recomputes all prices, generates a folio via the folio_seq Postgres
// sequence, and creates Cliente (upsert) + draft Pedido + DetallePedido[] +
// Cotización (Pendiente) + VariablesCotizacion[] + HistorialEstadosCotizacion
// in one transaction. Returns the folio + lookup URL.
export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const ip = getClientIp(req);
    const rateKey = `storefront:cotizaciones:${ip}`;
    const { allowed, retryAfterMs } = peekRateLimit(rateKey, SUBMIT_RATE_LIMIT);
    if (!allowed) {
      throw RateLimitError.fromMs(retryAfterMs);
    }
    const body = SolicitarCotizacionSchema.parse(await req.json());
    const result = await createCotizacionFromCart(body);
    // Record only now that the expensive transaction has succeeded.
    recordAttempt(rateKey, SUBMIT_RATE_LIMIT);

    // KIKW12 review #1b/#2: email the cliente a magic-link to the tracker.
    // issueAccessToken swallows its own errors (anti-enumeration), so a Resend
    // outage doesn't break the submit response — the cliente can re-request
    // the link from /tienda/cotizacion.
    await issueAccessToken({
      id_cotizacion: result.id_cotizacion,
      folio: result.folio,
      correo_destino: body.cliente.correo_electronico,
      nombre_cliente: body.cliente.nombre_cliente,
    });

    return created(result);
  } catch (err) {
    return handleError(err);
  }
}
