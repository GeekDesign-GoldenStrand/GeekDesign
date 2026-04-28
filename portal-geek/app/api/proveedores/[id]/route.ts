import { withRoleParams } from "@/lib/auth/guards";
import { ProveedorIdParams, UpdateProveedorSchema } from "@/lib/schemas/proveedores";
import { getProveedor, updateProveedor, deleteProveedor } from "@/lib/services/proveedores";
import { ok, noContent } from "@/lib/utils/api";
import { handleError } from "@/lib/utils/errors";

type Params = { id: string };

export const GET = withRoleParams<Params>(["Direccion"], async (_req, ctx) => {
  try {
    const { id } = ProveedorIdParams.parse(await ctx.params);
    return ok(await getProveedor(id));
  } catch (err) {
    return handleError(err);
  }
});

export const PUT = withRoleParams<Params>(["Direccion"], async (req, ctx) => {
  try {
    const { id } = ProveedorIdParams.parse(await ctx.params);
    const body = UpdateProveedorSchema.parse(await req.json());
    return ok(await updateProveedor(id, body));
  } catch (err) {
    return handleError(err);
  }
});

export const DELETE = withRoleParams<Params>(["Direccion"], async (_req, ctx) => {
  try {
    const { id } = ProveedorIdParams.parse(await ctx.params);
    await deleteProveedor(id);
    return noContent();
  } catch (err) {
    return handleError(err);
  }
});
