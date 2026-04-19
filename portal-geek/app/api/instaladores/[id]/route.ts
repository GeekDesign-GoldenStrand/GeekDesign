import { withRoleParams } from "@/lib/auth/guards";
import { InstaladorIdParams, UpdateInstaladorSchema } from "@/lib/schemas/instaladores";
import { getInstalador, updateInstalador, deleteInstalador } from "@/lib/services/instaladores";
import { ok, noContent } from "@/lib/utils/api";
import { handleError } from "@/lib/utils/errors";

type Params = { id: string };

const ALL_ADMIN = ["Direccion", "Administrador", "Colaborador", "Finanzas"] as const;

export const GET = withRoleParams<Params>([...ALL_ADMIN], async (_req, ctx) => {
  try {
    const { id } = InstaladorIdParams.parse(await ctx.params);
    return ok(await getInstalador(id));
  } catch (err) {
    return handleError(err);
  }
});

export const PUT = withRoleParams<Params>(["Direccion", "Administrador"], async (req, ctx) => {
  try {
    const { id } = InstaladorIdParams.parse(await ctx.params);
    const body = UpdateInstaladorSchema.parse(await req.json());
    return ok(await updateInstalador(id, body));
  } catch (err) {
    return handleError(err);
  }
});

export const DELETE = withRoleParams<Params>(["Direccion", "Administrador"], async (_req, ctx) => {
  try {
    const { id } = InstaladorIdParams.parse(await ctx.params);
    await deleteInstalador(id);
    return noContent();
  } catch (err) {
    return handleError(err);
  }
});
