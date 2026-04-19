import { withRoleParams } from "@/lib/auth/guards";
import { MaquinaIdParams, UpdateMaquinaSchema } from "@/lib/schemas/maquinas";
import { getMaquina, updateMaquina, deleteMaquina } from "@/lib/services/maquinas";
import { ok, noContent } from "@/lib/utils/api";
import { handleError } from "@/lib/utils/errors";

type Params = { id: string };

const ALL_ADMIN = ["Direccion", "Administrador", "Colaborador", "Finanzas"] as const;

export const GET = withRoleParams<Params>([...ALL_ADMIN], async (_req, ctx) => {
  try {
    const { id } = MaquinaIdParams.parse(await ctx.params);
    return ok(await getMaquina(id));
  } catch (err) {
    return handleError(err);
  }
});

export const PUT = withRoleParams<Params>(["Direccion", "Administrador"], async (req, ctx) => {
  try {
    const { id } = MaquinaIdParams.parse(await ctx.params);
    const body = UpdateMaquinaSchema.parse(await req.json());
    return ok(await updateMaquina(id, body));
  } catch (err) {
    return handleError(err);
  }
});

export const DELETE = withRoleParams<Params>(["Direccion", "Administrador"], async (_req, ctx) => {
  try {
    const { id } = MaquinaIdParams.parse(await ctx.params);
    await deleteMaquina(id);
    return noContent();
  } catch (err) {
    return handleError(err);
  }
});
