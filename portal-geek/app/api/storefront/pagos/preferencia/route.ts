import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

import { PreferenciaInputSchema } from "@/lib/schemas/pagos";
import { SESSION_COOKIE_NAME, readSessionCotizacionId } from "@/lib/services/cotizacion-access";
import { createPreferenceByCotizacion, getCotizacionIdByFolio } from "@/lib/services/pagos";
import { ok } from "@/lib/utils/api";
import { handleError, UnauthorizedError, ForbiddenError } from "@/lib/utils/errors";

// ST-17 §2 — crea la preferencia de Checkout Pro y devuelve el init_point para
// redirigir al cliente a Mercado Pago. Mismo control de acceso por cookie (D8);
// el monto se recalcula server-side dentro del servicio.
export async function POST(req: NextRequest) {
  try {
    const { folio } = PreferenciaInputSchema.parse(await req.json());

    const jwt = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
    const sessionCotId = jwt ? await readSessionCotizacionId(jwt) : null;
    if (sessionCotId === null) throw new UnauthorizedError("Acceso requerido");

    const folioCotId = await getCotizacionIdByFolio(folio);
    if (folioCotId === null || folioCotId !== sessionCotId) {
      throw new ForbiddenError("No tienes acceso a este pedido");
    }

    const result = await createPreferenceByCotizacion(sessionCotId);
    return ok(result);
  } catch (err) {
    return handleError(err);
  }
}
