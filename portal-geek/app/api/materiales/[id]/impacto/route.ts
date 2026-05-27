import { withSectionParams } from "@/lib/auth/guards";
import { MaterialIdParams } from "@/lib/schemas/materiales";
import { getMaterialImpacto } from "@/lib/services/materiales";
import { ok } from "@/lib/utils/api";
import { handleError } from "@/lib/utils/errors";

type Params = { id: string };

// Returns the number of distinct servicios, proveedores e instaladores that
// would be affected by deleting this material (group or individual). Consumed
// by the second-step delete confirmation in the materials UI.
export const GET = withSectionParams<Params>("materiales", "read", async (_req, ctx) => {
  try {
    const { id } = MaterialIdParams.parse(await ctx.params);
    return ok(await getMaterialImpacto(id));
  } catch (err) {
    return handleError(err);
  }
});
