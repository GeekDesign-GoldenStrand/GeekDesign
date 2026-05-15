import { withRoleParams } from "@/lib/auth/guards";
import { MaquinaIdParams, AsignarServiciosSchema } from "@/lib/schemas/maquinas";
import { asignarServicios } from "@/lib/services/maquinas";
import { ok } from "@/lib/utils/api";
import { handleError } from "@/lib/utils/errors";

type Params = { id: string };

export const PUT = withRoleParams<Params>(["Direccion"], async (req, ctx) => {
  try {
    const { id } = MaquinaIdParams.parse(await ctx.params);
    const { servicios } = AsignarServiciosSchema.parse(await req.json());
    return ok(await asignarServicios(id, servicios));
  } catch (err) {
    return handleError(err);
  }
});
