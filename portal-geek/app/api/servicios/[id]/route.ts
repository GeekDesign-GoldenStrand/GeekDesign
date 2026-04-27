import type { NextRequest } from "next/server";

import { withRoleParams } from "@/lib/auth/guards";
import { ServicioIdParams, UpdateServicioSchema } from "@/lib/schemas/servicios";
import { getServicioWithDetails, updateServicio, deleteServicio } from "@/lib/services/servicios";
import { ok, noContent } from "@/lib/utils/api";
import { handleError } from "@/lib/utils/errors";

type Params = { id: string };

// Public — returns active service with full details (opciones, materiales, precio base)
export async function GET(_req: NextRequest, ctx: { params: Promise<Params> }) {
  try {
    const { id } = ServicioIdParams.parse(await ctx.params);
    return ok(await getServicioWithDetails(id));
  } catch (err) {
    return handleError(err);
  }
}

export const PUT = withRoleParams<Params>(["Administrador"], async (req, ctx) => {
  try {
    const { id } = ServicioIdParams.parse(await ctx.params);
    const body = UpdateServicioSchema.parse(await req.json());
    return ok(await updateServicio(id, body));
  } catch (err) {
    return handleError(err);
  }
});

export const DELETE = withRoleParams<Params>(["Administrador"], async (_req, ctx) => {
  try {
    const { id } = ServicioIdParams.parse(await ctx.params);
    await deleteServicio(id);
    return noContent();
  } catch (err) {
    return handleError(err);
  }
});
