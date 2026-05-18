import { withRoleParams } from "@/lib/auth/guards";
import { PedidoIdParams, UpdatePedidoSchema } from "@/lib/schemas/pedidos";
import { getPedido, updatePedido, deletePedido } from "@/lib/services/pedidos";
import { ok, noContent } from "@/lib/utils/api";
import { handleError } from "@/lib/utils/errors";

type Params = { id: string };

export const GET = withRoleParams<Params>(["Direccion", "Colaborador"], async (_req, ctx) => {
  try {
    const { id } = PedidoIdParams.parse(await ctx.params);
    return ok(await getPedido(id));
  } catch (err) {
    return handleError(err);
  }
});

export const PUT = withRoleParams<Params>(["Direccion", "Colaborador"], async (req, ctx) => {
  try {
    const { id } = PedidoIdParams.parse(await ctx.params);
    const body = UpdatePedidoSchema.parse(await req.json());
    return ok(await updatePedido(id, body));
  } catch (err) {
    return handleError(err);
  }
});

export const DELETE = withRoleParams<Params>(["Direccion"], async (_req, ctx) => {
  try {
    const { id } = PedidoIdParams.parse(await ctx.params);
    await deletePedido(id);
    return noContent();
  } catch (err) {
    return handleError(err);
  }
});
