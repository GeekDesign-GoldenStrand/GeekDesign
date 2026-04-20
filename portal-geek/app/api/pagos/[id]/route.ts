import { withRoleParams } from "@/lib/auth/guards";
import { PagoIdParams, UpdatePagoSchema } from "@/lib/schemas/pagos";
import { getPago, updatePago } from "@/lib/services/pagos";
import { ok } from "@/lib/utils/api";
import { handleError } from "@/lib/utils/errors";

type Params = { id: string };

export const GET = withRoleParams<Params>(["Direccion", "Finanzas"], async (_req, ctx) => {
  try {
    const { id } = PagoIdParams.parse(await ctx.params);
    return ok(await getPago(id));
  } catch (err) {
    return handleError(err);
  }
});

export const PUT = withRoleParams<Params>(
  ["Finanzas"],
  async (req, ctx) => {
    try {
      const { id } = PagoIdParams.parse(await ctx.params);
      const body = UpdatePagoSchema.parse(await req.json());
      return ok(await updatePago(id, body));
    } catch (err) {
      return handleError(err);
    }
  }
);
