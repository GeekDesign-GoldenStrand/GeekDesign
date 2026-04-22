import { withRoleParams } from "@/lib/auth/guards";
import { UsuarioIdParams, UpdateUsuarioSchema } from "@/lib/schemas/usuarios";
import { getUsuario, updateUsuario, deleteUsuario } from "@/lib/services/usuarios";
import { ok, noContent } from "@/lib/utils/api";
import { handleError } from "@/lib/utils/errors";

type Params = { id: string };

export const GET = withRoleParams<Params>(["Direccion"], async (_req, ctx) => {
  try {
    const { id } = UsuarioIdParams.parse(await ctx.params);
    return ok(await getUsuario(id));
  } catch (err) {
    return handleError(err);
  }
});

export const PUT = withRoleParams<Params>(["Direccion"], async (req, ctx) => {
  try {
    const { id } = UsuarioIdParams.parse(await ctx.params);
    const body = UpdateUsuarioSchema.parse(await req.json());
    return ok(await updateUsuario(id, body));
  } catch (err) {
    return handleError(err);
  }
});

export const DELETE = withRoleParams<Params>(["Direccion"], async (_req, ctx) => {
  try {
    const { id } = UsuarioIdParams.parse(await ctx.params);
    await deleteUsuario(id);
    return noContent();
  } catch (err) {
    return handleError(err);
  }
});
