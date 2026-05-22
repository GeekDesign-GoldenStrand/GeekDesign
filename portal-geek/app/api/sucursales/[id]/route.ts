import { withRoleParams } from "@/lib/auth/guards";
import { SucursalIdParams, UpdateSucursalSchema } from "@/lib/schemas/sucursales";
import { getSucursal, updateSucursal, deleteSucursal } from "@/lib/services/sucursales";
import { ok, noContent } from "@/lib/utils/api";
import { handleError } from "@/lib/utils/errors";

type Params = { id: string };

export const GET = withRoleParams<Params>(["Direccion", "Administrador"], async (_req, ctx) => {
  try {
    // Route params come as strings, so we validate and coerce them before reaching the service layer.
    const { id } = SucursalIdParams.parse(await ctx.params);

    return ok(await getSucursal(id));
  } catch (err) {
    return handleError(err);
  }
});

export const PUT = withRoleParams<Params>(["Direccion", "Administrador"], async (req, ctx) => {
  try {
    const { id } = SucursalIdParams.parse(await ctx.params);

    // The update schema accepts partial branch fields.
    // This keeps the endpoint safe while allowing edit forms to update only changed values.
    const body = UpdateSucursalSchema.parse(await req.json());

    return ok(await updateSucursal(id, body));
  } catch (err) {
    return handleError(err);
  }
});

export const DELETE = withRoleParams<Params>(["Direccion", "Administrador"], async (_req, ctx) => {
  try {
    const { id } = SucursalIdParams.parse(await ctx.params);

    // deleteSucursal performs a soft delete by marking the branch as inactive.
    // This preserves historical relations while removing it from the active table view.
    await deleteSucursal(id);

    return noContent();
  } catch (err) {
    return handleError(err);
  }
});
