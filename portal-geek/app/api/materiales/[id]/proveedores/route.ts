import { withRoleParams } from "@/lib/auth/guards";
import { MaterialIdParams } from "@/lib/schemas/materiales";
import { getMaterialProveedores } from "@/lib/services/materiales";
import { ok } from "@/lib/utils/api";
import { handleError } from "@/lib/utils/errors";

type Params = { id: string };

export const GET = withRoleParams<Params>(
  ["Direccion", "Administrador", "Colaborador"],
  async (_req, ctx) => {
    try {
      const { id } = MaterialIdParams.parse(await ctx.params);
      return ok(await getMaterialProveedores(id));
    } catch (err) {
      return handleError(err);
    }
  }
);
