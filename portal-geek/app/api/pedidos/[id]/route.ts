import { withRoleParams, withSectionParams } from "@/lib/auth/guards";
import { PedidoIdParams, UpdatePedidoSchema } from "@/lib/schemas/pedidos";
import { getPedido, updatePedido, deletePedido } from "@/lib/services/pedidos";
import { ok, noContent } from "@/lib/utils/api";
import { handleError } from "@/lib/utils/errors";

type Params = { id: string };

// I1/E2 — PE-05: the detailed pedido view is Dirección-only by SRS, even
// though pedidos.read at the section level admits Colaborador and Finanzas
// (they use list endpoints + /estatus, not this detail GET). Locking here
// closes the within-section gap; do not relax to withSectionParams("pedidos",
// "read") again without splitting the response shape.
export const GET = withRoleParams<Params>(["Direccion"], async (_req, ctx) => {
  try {
    const { id } = PedidoIdParams.parse(await ctx.params);
    return ok(await getPedido(id));
  } catch (err) {
    return handleError(err);
  }
});

export const PUT = withSectionParams<Params>("pedidos", "write", async (req, ctx) => {
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
