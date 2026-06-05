import { withSectionParams } from "@/lib/auth/guards";
import { UsuarioIdParams, UpdateUsuarioSchema } from "@/lib/schemas/usuarios";
import { getUsuario, updateUsuario, deleteUsuario } from "@/lib/services/usuarios";
import { ok, noContent } from "@/lib/utils/api";
import { handleError, ValidationError } from "@/lib/utils/errors";

type Params = { id: string };

export const GET = withSectionParams<Params>("usuarios", "read", async (_req, ctx) => {
  try {
    const { id } = UsuarioIdParams.parse(await ctx.params);
    return ok(await getUsuario(id));
  } catch (err) {
    return handleError(err);
  }
});

export const PUT = withSectionParams<Params>("usuarios", "write", async (req, ctx, session) => {
  try {
    const { id } = UsuarioIdParams.parse(await ctx.params);
    const body = UpdateUsuarioSchema.parse(await req.json());
    // Prevent self-demotion: a Dirección user changing their own id_rol would
    // lose access to /usuarios as soon as their JWT expires, with no UI path
    // back. Block it here so recovery isn't a DB-edit problem.
    if (body.id_rol !== undefined && id === session.id) {
      throw new ValidationError("No puedes cambiar tu propio rol");
    }
    return ok(await updateUsuario(id, body));
  } catch (err) {
    return handleError(err);
  }
});

export const DELETE = withSectionParams<Params>("usuarios", "write", async (_req, ctx) => {
  try {
    const { id } = UsuarioIdParams.parse(await ctx.params);
    await deleteUsuario(id);
    return noContent();
  } catch (err) {
    return handleError(err);
  }
});
