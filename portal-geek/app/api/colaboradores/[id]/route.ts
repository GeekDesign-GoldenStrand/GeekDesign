import { withRoleParams } from "@/lib/auth/guards";
import { ColaboradorIdParams, UpdateColaboradorSchema } from "@/lib/schemas/colaboradores";
import { getColaborador, updateColaborador, deleteColaborador } from "@/lib/services/colaboradores";
import { ok, noContent } from "@/lib/utils/api";
import { handleError } from "@/lib/utils/errors";

type Params = { id: string };

export const GET = withRoleParams<Params>(["Direccion", "Administrador"], async (_req, ctx) => {
  try {
    const { id } = ColaboradorIdParams.parse(await ctx.params);
    return ok(await getColaborador(id));
  } catch (err) {
    return handleError(err);
  }
});

export const PUT = withRoleParams<Params>(["Direccion", "Administrador"], async (req, ctx) => {
  try {
    const { id } = ColaboradorIdParams.parse(await ctx.params);
    const body = UpdateColaboradorSchema.parse(await req.json());
    return ok(await updateColaborador(id, body));
  } catch (err) {
    return handleError(err);
  }
});

export const DELETE = withRoleParams<Params>(["Direccion", "Administrador"], async (_req, ctx) => {
  try {
    const { id } = ColaboradorIdParams.parse(await ctx.params);
    await deleteColaborador(id);
    return noContent();
  } catch (err) {
    return handleError(err);
  }
});
