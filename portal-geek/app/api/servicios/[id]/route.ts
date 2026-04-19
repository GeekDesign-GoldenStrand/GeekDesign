import { withRoleParams } from "@/lib/auth/guards";
import { ServicioIdParams, UpdateServicioSchema } from "@/lib/schemas/servicios";
import { getServicio, updateServicio, deleteServicio } from "@/lib/services/servicios";
import { ok, noContent } from "@/lib/utils/api";
import { handleError } from "@/lib/utils/errors";

type Params = { id: string };

const ALL_ADMIN = ["Direccion", "Administrador", "Colaborador", "Finanzas"] as const;

export const GET = withRoleParams<Params>([...ALL_ADMIN], async (_req, ctx) => {
  try {
    const { id } = ServicioIdParams.parse(await ctx.params);
    return ok(await getServicio(id));
  } catch (err) {
    return handleError(err);
  }
});

export const PUT = withRoleParams<Params>(["Direccion", "Administrador"], async (req, ctx) => {
  try {
    const { id } = ServicioIdParams.parse(await ctx.params);
    const body = UpdateServicioSchema.parse(await req.json());
    return ok(await updateServicio(id, body));
  } catch (err) {
    return handleError(err);
  }
});

export const DELETE = withRoleParams<Params>(["Direccion", "Administrador"], async (_req, ctx) => {
  try {
    const { id } = ServicioIdParams.parse(await ctx.params);
    await deleteServicio(id);
    return noContent();
  } catch (err) {
    return handleError(err);
  }
});
