import { withSectionParams } from "@/lib/auth/guards";
import { MaterialIdParams } from "@/lib/schemas/materiales";
import { getMaterialProveedores } from "@/lib/services/materiales";
import { ok } from "@/lib/utils/api";
import { handleError } from "@/lib/utils/errors";

type Params = { id: string };

// Lists a material's suppliers and their costs — proveedor/pricing data
// (PROV-04/05), which is Dirección-only, not the MAT-01 catalog consultation
// that Colaborador may read.
export const GET = withSectionParams<Params>("proveedores", "read", async (_req, ctx) => {
  try {
    const { id } = MaterialIdParams.parse(await ctx.params);
    return ok(await getMaterialProveedores(id));
  } catch (err) {
    return handleError(err);
  }
});
