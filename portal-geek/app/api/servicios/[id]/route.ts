import type { NextRequest } from "next/server";

import { withRoleParams } from "@/lib/auth/guards";
import { ServicioIdParams, UpdateServicioSchema } from "@/lib/schemas/servicios";
import { getServicio, updateServicio, deleteServicio } from "@/lib/services/servicios";
import { ok, noContent } from "@/lib/utils/api";
import { handleError } from "@/lib/utils/errors";

type Params = { id: string };

export const GET = withRoleParams<Params>(["Administrador"], async (req: NextRequest, ctx) => {
  try {
    const { id } = ServicioIdParams.parse(await ctx.params);
    return ok(await getServicio(id));
  } catch (err) {
    return handleError(err);
  }
});

export const PUT = withRoleParams<Params>(["Administrador"], async (req: NextRequest, ctx, session) => {
  try {
    const { id } = ServicioIdParams.parse(await ctx.params);
    const body = UpdateServicioSchema.parse(await req.json());
    return ok(await updateServicio(id, body, session.id));
  } catch (err) {
    return handleError(err);
  }
});

export const DELETE = withRoleParams<Params>(["Administrador"], async (req: NextRequest, ctx) => {
  try {
    const { id } = ServicioIdParams.parse(await ctx.params);
    await deleteServicio(id);
    return noContent();
  } catch (err) {
    return handleError(err);
  }
});
