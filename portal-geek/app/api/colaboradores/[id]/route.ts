import { withSectionParams } from "@/lib/auth/guards";
import { ColaboradorIdParams, UpdateColaboradorSchema } from "@/lib/schemas/colaboradores";
import { getColaborador, updateColaborador, deleteColaborador } from "@/lib/services/colaboradores";
import { ok, noContent } from "@/lib/utils/api";
import { handleError, ValidationError } from "@/lib/utils/errors";

type Params = { id: string };

export const GET = withSectionParams<Params>("colaboradores", "read", async (_req, ctx) => {
  try {
    const { id } = ColaboradorIdParams.parse(await ctx.params);
    return ok(await getColaborador(id));
  } catch (err) {
    return handleError(err);
  }
});

export const PUT = withSectionParams<Params>(
  "colaboradores",
  "write",
  async (req, ctx, session) => {
    try {
      const { id } = ColaboradorIdParams.parse(await ctx.params);
      const body = UpdateColaboradorSchema.parse(await req.json());
      // Prevent self-demotion: a Dirección user changing their own id_rol would
      // lose admin access once their JWT expires, with no UI path back.
      if (body.id_rol !== undefined && id === session.id) {
        throw new ValidationError("No puedes cambiar tu propio rol");
      }
      return ok(await updateColaborador(id, body));
    } catch (err) {
      return handleError(err);
    }
  }
);

export const DELETE = withSectionParams<Params>("colaboradores", "write", async (_req, ctx) => {
  try {
    const { id } = ColaboradorIdParams.parse(await ctx.params);
    await deleteColaborador(id);
    return noContent();
  } catch (err) {
    return handleError(err);
  }
});
