import type { NextRequest } from "next/server";

import { SolicitarCotizacionSchema } from "@/lib/schemas/cotizaciones";
import { createCotizacionFromCart } from "@/lib/services/cotizaciones";
import { created } from "@/lib/utils/api";
import { handleError } from "@/lib/utils/errors";

// Public storefront endpoint — cliente submits cart (no auth).
// Server recomputes all prices, generates a folio via the folio_seq Postgres
// sequence, and creates Cliente (upsert) + draft Pedido + DetallePedido[] +
// Cotización (Pendiente) + VariablesCotizacion[] + HistorialEstadosCotizacion
// in one transaction. Returns the folio + lookup URL.
export async function POST(req: NextRequest) {
  try {
    const body = SolicitarCotizacionSchema.parse(await req.json());
    const result = await createCotizacionFromCart(body);
    return created(result);
  } catch (err) {
    return handleError(err);
  }
}
