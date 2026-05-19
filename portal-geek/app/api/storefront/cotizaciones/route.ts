import type { NextRequest } from "next/server";

import { SolicitarCotizacionSchema } from "@/lib/schemas/cotizaciones";
import { createCotizacionFromCart } from "@/lib/services/cotizaciones";
import { created } from "@/lib/utils/api";
import { handleError, RateLimitError } from "@/lib/utils/errors";
import { checkRateLimit } from "@/lib/utils/rate-limit";

// KIKW12 review #3: rate-limit public DB-write endpoint per IP. Submitting a
// cotización runs a multi-row transaction (Cliente upsert + Pedido + N×Detalle
// + Cotización + N×VariablesCotizacion + history) — abuse becomes a DoS vector.
// Same severity as auth/login: 5 attempts per 15-minute window.
const SUBMIT_RATE_LIMIT = { maxAttempts: 5, windowMs: 15 * 60_000 };

// Public storefront endpoint — cliente submits cart (no auth).
// Server recomputes all prices, generates a folio via the folio_seq Postgres
// sequence, and creates Cliente (upsert) + draft Pedido + DetallePedido[] +
// Cotización (Pendiente) + VariablesCotizacion[] + HistorialEstadosCotizacion
// in one transaction. Returns the folio + lookup URL.
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
    const { allowed } = checkRateLimit(`storefront:cotizaciones:${ip}`, SUBMIT_RATE_LIMIT);
    if (!allowed) {
      throw new RateLimitError();
    }
    const body = SolicitarCotizacionSchema.parse(await req.json());
    const result = await createCotizacionFromCart(body);
    return created(result);
  } catch (err) {
    return handleError(err);
  }
}
