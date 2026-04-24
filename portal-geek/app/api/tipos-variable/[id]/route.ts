import { withRoleParams } from "@/lib/auth/guards";
import {
  TipoVariableIdParams,
  UpdateTipoVariableSchema,
} from "@/lib/schemas/tiposVariable";
import {
  getTipoVariable,
  updateTipoVariable,
  deleteTipoVariable,
} from "@/lib/services/tiposVariable";
import { ok, noContent } from "@/lib/utils/api";
import { handleError } from "@/lib/utils/errors";

type Params = { id: string };

export const GET = withRoleParams<Params>(
  ["Administrador"],
  async (_req, ctx) => {
    try {
      const { id } = TipoVariableIdParams.parse(await ctx.params);
      return ok(await getTipoVariable(id));
    } catch (err) {
      return handleError(err);
    }
  }
);

export const PUT = withRoleParams<Params>(
  ["Administrador"],
  async (req, ctx) => {
    try {
      const { id } = TipoVariableIdParams.parse(await ctx.params);
      const body = UpdateTipoVariableSchema.parse(await req.json());
      return ok(await updateTipoVariable(id, body));
    } catch (err) {
      return handleError(err);
    }
  }
);

export const DELETE = withRoleParams<Params>(
  ["Administrador"],
  async (_req, ctx) => {
    try {
      const { id } = TipoVariableIdParams.parse(await ctx.params);
      await deleteTipoVariable(id);
      return noContent();
    } catch (err) {
      return handleError(err);
    }
  }
);