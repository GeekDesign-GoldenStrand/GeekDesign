import { withSectionParams } from "@/lib/auth/guards";
import { MaquinaIdParams, UpdateMaquinaSchema } from "@/lib/schemas/maquinas";
import { getMaquina, updateMaquina, deleteMaquina } from "@/lib/services/maquinas";
import { ok, noContent } from "@/lib/utils/api";
import { handleError } from "@/lib/utils/errors";

type Params = { id: string };

export const GET = withSectionParams<Params>("maquinas", "read", async (_req, ctx) => {
  try {
    const { id } = MaquinaIdParams.parse(await ctx.params);
    return ok(await getMaquina(id));
  } catch (err) {
    return handleError(err);
  }
});

export const PUT = withSectionParams<Params>("maquinas", "write", async (req, ctx) => {
  try {
    const { id } = MaquinaIdParams.parse(await ctx.params);
    const body = UpdateMaquinaSchema.parse(await req.json());
    return ok(await updateMaquina(id, body));
  } catch (err) {
    return handleError(err);
  }
});

export const DELETE = withSectionParams<Params>("maquinas", "write", async (_req, ctx) => {
  try {
    const { id } = MaquinaIdParams.parse(await ctx.params);
    await deleteMaquina(id);
    return noContent();
  } catch (err) {
    return handleError(err);
  }
});
