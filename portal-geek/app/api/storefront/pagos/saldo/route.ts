import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

import { SaldoQuerySchema } from "@/lib/schemas/pagos";
import { SESSION_COOKIE_NAME, readSessionCotizacionId } from "@/lib/services/cotizacion-access";
import { getSaldoByCotizacion, getCotizacionIdByFolio } from "@/lib/services/pagos";
import { ok } from "@/lib/utils/api";
import { handleError, UnauthorizedError, ForbiddenError } from "@/lib/utils/errors";

// ST-17 §1 — saldo del pedido para mostrar el resumen de pago al cliente.
// Autorización (D8): la cookie de sesión de cotización debe corresponder al
// folio consultado. Sin cuenta de usuario; el enlace mágico ya emitió la cookie.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const { folio } = SaldoQuerySchema.parse({ folio: searchParams.get("folio") });

    const jwt = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
    const sessionCotId = jwt ? await readSessionCotizacionId(jwt) : null;
    if (sessionCotId === null) throw new UnauthorizedError("Acceso requerido");

    const folioCotId = await getCotizacionIdByFolio(folio);
    if (folioCotId === null || folioCotId !== sessionCotId) {
      // Mensaje genérico anti-enumeración; no revela si el folio existe.
      throw new ForbiddenError("No tienes acceso a este pedido");
    }

    return ok(await getSaldoByCotizacion(sessionCotId));
  } catch (err) {
    return handleError(err);
  }
}
