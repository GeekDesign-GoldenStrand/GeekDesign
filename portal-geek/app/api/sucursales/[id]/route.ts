import { withRoleParams } from "@/lib/auth/guards";
import { SucursalIdParams, UpdateSucursalSchema } from "@/lib/schemas/sucursales";
import { getSucursal, updateSucursal, deleteSucursal } from "@/lib/services/sucursales";
import { ok, noContent } from "@/lib/utils/api";
import { handleError } from "@/lib/utils/errors";

type Params = { id: string };

export const GET = withRoleParams<Params>(["Direccion"], async (_req, ctx) => {
  try {
    const { id } = SucursalIdParams.parse(await ctx.params);
    return ok(await getSucursal(id));
  } catch (err) {
    return handleError(err);
  }
});

export const PUT = withRoleParams<Params>(["Direccion"], async (req, ctx) => {
  try {
    const { id } = SucursalIdParams.parse(await ctx.params);
    const body = UpdateSucursalSchema.parse(await req.json());
    return ok(await updateSucursal(id, body));
  } catch (err) {
    return handleError(err);
  }
});

export const DELETE = withRoleParams<Params>(["Direccion"], async (_req, ctx) => {
  try {
    const { id } = SucursalIdParams.parse(await ctx.params);
    await deleteSucursal(id);
    return noContent();
  } catch (err) {
    return handleError(err);
  }
});
