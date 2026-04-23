import { withRoleParams } from "@/lib/auth/guards";
import { CotizacionIdParams, UpdateCotizacionSchema } from "@/lib/schemas/cotizaciones";
import { getCotizacion, updateCotizacion, deleteCotizacion } from "@/lib/services/cotizaciones";
import { ok, noContent } from "@/lib/utils/api";
import { handleError } from "@/lib/utils/errors";

type Params = { id: string };

export const GET = withRoleParams<Params>(["Direccion"], async (_req, ctx) => {
  try {
    const { id } = CotizacionIdParams.parse(await ctx.params);
    return ok(await getCotizacion(id));
  } catch (err) {
    return handleError(err);
  }
});

export const PUT = withRoleParams<Params>(["Direccion"], async (req, ctx) => {
  try {
    const { id } = CotizacionIdParams.parse(await ctx.params);
    const body = UpdateCotizacionSchema.parse(await req.json());
    return ok(await updateCotizacion(id, body));
  } catch (err) {
    return handleError(err);
  }
});

export const DELETE = withRoleParams<Params>(["Direccion"], async (_req, ctx) => {
  try {
    const { id } = CotizacionIdParams.parse(await ctx.params);
    await deleteCotizacion(id);
    return noContent();
  } catch (err) {
    return handleError(err);
  }
});
