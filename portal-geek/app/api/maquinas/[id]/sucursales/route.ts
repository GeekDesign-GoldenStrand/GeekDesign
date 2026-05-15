import { withRoleParams } from "@/lib/auth/guards";
import { MaquinaIdParams, AsignarSucursalSchema } from "@/lib/schemas/maquinas";
import { asignarSucursal } from "@/lib/services/maquinas";
import { ok } from "@/lib/utils/api";
import { handleError } from "@/lib/utils/errors";

type Params = { id: string };

export const PUT = withRoleParams<Params>(["Direccion"], async (req, ctx) => {
  try {
    const { id } = MaquinaIdParams.parse(await ctx.params);
    const { sucursal } = AsignarSucursalSchema.parse(await req.json());
    return ok(await asignarSucursal(id, sucursal));
  } catch (err) {
    return handleError(err);
  }
});
