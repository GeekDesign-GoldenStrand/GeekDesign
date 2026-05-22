import { withRoleParams } from "@/lib/auth/guards";
import { AssignmentSchema } from "@/lib/schemas/asignaciones";
import { ProveedorIdParams } from "@/lib/schemas/proveedores";
import { getProviderAssignments, syncProviderAssignments } from "@/lib/services/proveedores";
import { ok } from "@/lib/utils/api";
import { handleError } from "@/lib/utils/errors";

type Params = { id: string };

export const GET = withRoleParams<Params>(["Direccion"], async (_req, ctx) => {
  try {
    const { id } = ProveedorIdParams.parse(await ctx.params);
    return ok(await getProviderAssignments(id));
  } catch (err) {
    return handleError(err);
  }
});

export const PUT = withRoleParams<Params>(["Direccion"], async (req, ctx) => {
  try {
    const { id } = ProveedorIdParams.parse(await ctx.params);
    const body = AssignmentSchema.parse(await req.json());
    await syncProviderAssignments(id, body.type, body.items);
    return ok({ success: true });
  } catch (err) {
    return handleError(err);
  }
});
