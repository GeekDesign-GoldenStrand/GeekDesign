import { withSectionParams } from "@/lib/auth/guards";
import { GastoIdParams, UpdateGastoSchema } from "@/lib/schemas/gastos";
import { getGasto, updateGasto, deleteGasto } from "@/lib/services/gastos";
import { ok, noContent } from "@/lib/utils/api";
import { handleError } from "@/lib/utils/errors";

type Params = { id: string };

export const GET = withSectionParams<Params>("finanzas", "read", async (_req, ctx) => {
  try {
    const { id } = GastoIdParams.parse(await ctx.params);
    return ok(await getGasto(id));
  } catch (err) {
    return handleError(err);
  }
});

export const PUT = withSectionParams<Params>("finanzas", "write", async (req, ctx) => {
  try {
    const { id } = GastoIdParams.parse(await ctx.params);
    const body = UpdateGastoSchema.parse(await req.json());
    return ok(await updateGasto(id, body));
  } catch (err) {
    return handleError(err);
  }
});

export const DELETE = withSectionParams<Params>("finanzas", "write", async (_req, ctx) => {
  try {
    const { id } = GastoIdParams.parse(await ctx.params);
    await deleteGasto(id);
    return noContent();
  } catch (err) {
    return handleError(err);
  }
});
