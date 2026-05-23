import { withRoleParams } from "@/lib/auth/guards";
import { AplicarDescuentoSchema, CotizacionIdParams } from "@/lib/schemas/cotizaciones";
import { aplicarDescuento } from "@/lib/services/cotizaciones";
import { ok } from "@/lib/utils/api";
import { handleError } from "@/lib/utils/errors";

type Params = { id: string };

export const PATCH = withRoleParams<Params>(["Direccion"], async (req, ctx) => {
  try {
    const { id } = CotizacionIdParams.parse(await ctx.params);
    const body = AplicarDescuentoSchema.parse(await req.json());

    const updateData: any = {};
    if ("porcentaje_descuento" in body) {
      updateData.porcentaje_descuento = body.porcentaje_descuento;
    }
    if ("motivo_descuento" in body) {
      updateData.motivo_descuento = body.motivo_descuento ?? null;
    }

    const cotizacion = await aplicarDescuento(
      id,
      updateData.porcentaje_descuento,
      updateData.motivo_descuento
    );

    return ok(cotizacion);
  } catch (err) {
    return handleError(err);
  }
});
