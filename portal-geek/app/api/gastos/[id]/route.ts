import { withRoleParams } from "@/lib/auth/guards";
import { GastoIdParams, UpdateGastoSchema } from "@/lib/schemas/gastos";
import { getGasto, updateGasto, deleteGasto } from "@/lib/services/gastos";
import { ok, noContent } from "@/lib/utils/api";
import { handleError } from "@/lib/utils/errors";

type Params = { id: string };

export const GET = withRoleParams<Params>(["Finanzas"], async (_req, ctx) => {
  try {
    const { id } = GastoIdParams.parse(await ctx.params);
    return ok(await getGasto(id));
  } catch (err) {
    return handleError(err);
  }
});

export const PUT = withRoleParams<Params>(["Finanzas"], async (req, ctx) => {
  try {
    const { id } = GastoIdParams.parse(await ctx.params);
    const body = UpdateGastoSchema.parse(await req.json());
    return ok(await updateGasto(id, body));
  } catch (err) {
    return handleError(err);
  }
});

export const DELETE = withRoleParams<Params>(["Finanzas"], async (_req, ctx) => {
  try {
    const { id } = GastoIdParams.parse(await ctx.params);
    await deleteGasto(id);
    return noContent();
  } catch (err) {
    return handleError(err);
  }
});
