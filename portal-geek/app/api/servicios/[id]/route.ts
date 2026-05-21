import type { NextRequest } from "next/server";

import { withRoleParams } from "@/lib/auth/guards";
import { ServicioIdParams, UpdateServicioSchema } from "@/lib/schemas/servicios";
import {
  getServicioParaAdmin,
  toServicioAdminDetalle,
  updateServicio,
  deleteServicio,
} from "@/lib/services/servicios";
import { ok, noContent } from "@/lib/utils/api";
import { handleError } from "@/lib/utils/errors";

type Params = { id: string };

export const GET = withRoleParams<Params>(
  ["Administrador", "Direccion"],
  async (_req: NextRequest, ctx, _session) => {
    try {
      const { id } = ServicioIdParams.parse(await ctx.params);
      const raw = await getServicioParaAdmin(id);
      return ok(toServicioAdminDetalle(raw));
    } catch (err) {
      return handleError(err);
    }
  }
);

export const PUT = withRoleParams<Params>(
  ["Administrador", "Direccion"],
  async (req: NextRequest, ctx, session) => {
    try {
      const { id } = ServicioIdParams.parse(await ctx.params);
      const body = UpdateServicioSchema.parse(await req.json());
      return ok(await updateServicio(id, body, session.id));
    } catch (err) {
      return handleError(err);
    }
  }
);

export const DELETE = withRoleParams<Params>(
  ["Administrador", "Direccion"],
  async (_req: NextRequest, ctx) => {
    try {
      const { id } = ServicioIdParams.parse(await ctx.params);
      await deleteServicio(id);
      return noContent();
    } catch (err) {
      return handleError(err);
    }
  }
);
