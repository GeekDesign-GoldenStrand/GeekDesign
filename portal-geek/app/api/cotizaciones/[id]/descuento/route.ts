import { withRoleParams } from "@/lib/auth/guards";
import { AplicarDescuentoSchema, CotizacionIdParams } from "@/lib/schemas/cotizaciones";
import { aplicarDescuento } from "@/lib/services/cotizaciones";
import { ok } from "@/lib/utils/api";
import { handleError } from "@/lib/utils/errors";

// COT-06 — Dirección agrega descuento a una cotización. Only Dirección
// can call it. The service layer enforces the estatus guard
// (Pendiente | Validada) and the percentage recalculation.

type Params = { id: string };

export const PATCH = withRoleParams<Params>(["Direccion"], async (req, ctx) => {
  try {
    const { id } = CotizacionIdParams.parse(await ctx.params);
    const body = AplicarDescuentoSchema.parse(await req.json());

    const cotizacion = await aplicarDescuento(id, body.porcentaje_descuento, body.motivo_descuento);

    return ok(cotizacion);
  } catch (err) {
    return handleError(err);
  }
});
