import { withRoleParams } from "@/lib/auth/guards";
import { AssignmentSchema } from "@/lib/schemas/asignaciones";
import { InstaladorIdParams } from "@/lib/schemas/instaladores";
import { getInstaladorAssignments, syncInstaladorAssignments } from "@/lib/services/instaladores";
import { ok } from "@/lib/utils/api";
import { handleError } from "@/lib/utils/errors";

type Params = { id: string };

export const GET = withRoleParams<Params>(["Direccion"], async (_req, ctx) => {
  try {
    const { id } = InstaladorIdParams.parse(await ctx.params);
    return ok(await getInstaladorAssignments(id));
  } catch (err) {
    return handleError(err);
  }
});

export const PUT = withRoleParams<Params>(["Direccion"], async (req, ctx) => {
  try {
    const { id } = InstaladorIdParams.parse(await ctx.params);
    const body = AssignmentSchema.parse(await req.json());
    // For installers, we only care about services, but we use the generic AssignmentSchema
    await syncInstaladorAssignments(id, body.ids);
    return ok({ success: true });
  } catch (err) {
    return handleError(err);
  }
});
