import { withRoleParams } from "@/lib/auth/guards";
import { GastoIdParams, UpdateGastoSchema } from "@/lib/schemas/gastos";
import { getGasto, updateGasto, deleteGasto } from "@/lib/services/gastos";
import { ok, noContent } from "@/lib/utils/api";
import { handleError } from "@/lib/utils/errors";

type Params = { id: string };

const FIN_ADMIN = ["Direccion", "Administrador", "Finanzas"] as const;

export const GET = withRoleParams<Params>([...FIN_ADMIN], async (_req, ctx) => {
  try {
    const { id } = GastoIdParams.parse(await ctx.params);
    return ok(await getGasto(id));
  } catch (err) {
    return handleError(err);
  }
});

export const PUT = withRoleParams<Params>([...FIN_ADMIN], async (req, ctx) => {
  try {
    const { id } = GastoIdParams.parse(await ctx.params);
    const body = UpdateGastoSchema.parse(await req.json());
    return ok(await updateGasto(id, body));
  } catch (err) {
    return handleError(err);
  }
});

export const DELETE = withRoleParams<Params>(["Direccion", "Administrador"], async (_req, ctx) => {
  try {
    const { id } = GastoIdParams.parse(await ctx.params);
    await deleteGasto(id);
    return noContent();
  } catch (err) {
    return handleError(err);
  }
});
