import { withRoleParams } from "@/lib/auth/guards";
import { MaterialIdParams, UpdateMaterialSchema } from "@/lib/schemas/materiales";
import { getMaterial, updateMaterial, deleteMaterial } from "@/lib/services/materiales";
import { ok, noContent } from "@/lib/utils/api";
import { handleError } from "@/lib/utils/errors";

type Params = { id: string };

export const GET = withRoleParams<Params>(["Direccion", "Colaborador"], async (_req, ctx) => {
  try {
    const { id } = MaterialIdParams.parse(await ctx.params);
    return ok(await getMaterial(id));
  } catch (err) {
    return handleError(err);
  }
});

export const PUT = withRoleParams<Params>(["Direccion"], async (req, ctx) => {
  try {
    const { id } = MaterialIdParams.parse(await ctx.params);
    const body = UpdateMaterialSchema.parse(await req.json());
    return ok(await updateMaterial(id, body));
  } catch (err) {
    return handleError(err);
  }
});

export const DELETE = withRoleParams<Params>(["Direccion"], async (_req, ctx) => {
  try {
    const { id } = MaterialIdParams.parse(await ctx.params);
    await deleteMaterial(id);
    return noContent();
  } catch (err) {
    return handleError(err);
  }
});
