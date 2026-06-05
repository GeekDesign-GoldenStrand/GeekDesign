import { withSectionParams } from "@/lib/auth/guards";
import { ProveedorIdParams, UpdateProveedorSchema } from "@/lib/schemas/proveedores";
import { getProveedor, updateProveedor, deleteProveedor } from "@/lib/services/proveedores";
import { ok, noContent } from "@/lib/utils/api";
import { handleError } from "@/lib/utils/errors";

type Params = { id: string };

export const GET = withSectionParams<Params>("proveedores", "read", async (_req, ctx) => {
  try {
    const { id } = ProveedorIdParams.parse(await ctx.params);
    return ok(await getProveedor(id));
  } catch (err) {
    return handleError(err);
  }
});

export const PUT = withSectionParams<Params>("proveedores", "write", async (req, ctx) => {
  try {
    const { id } = ProveedorIdParams.parse(await ctx.params);
    const body = UpdateProveedorSchema.parse(await req.json());
    return ok(await updateProveedor(id, body));
  } catch (err) {
    return handleError(err);
  }
});

export const DELETE = withSectionParams<Params>("proveedores", "write", async (_req, ctx) => {
  try {
    const { id } = ProveedorIdParams.parse(await ctx.params);
    await deleteProveedor(id);
    return noContent();
  } catch (err) {
    return handleError(err);
  }
});
