import { z } from "zod";

import { withRoleParams } from "@/lib/auth/guards";
import { PedidoIdParams } from "@/lib/schemas/pedidos";
import { changePedidoStatus, PEDIDO_STATUS } from "@/lib/services/pedidos";
import { ok } from "@/lib/utils/api";
import { handleError } from "@/lib/utils/errors";

type Params = { id: string };

const ChangePedidoStatusSchema = z.object({
  estatus: z.enum([
    PEDIDO_STATUS.PENDIENTE,
    PEDIDO_STATUS.EN_PRODUCCION,
    PEDIDO_STATUS.FINALIZADO,
    PEDIDO_STATUS.ENTREGADO,
    PEDIDO_STATUS.CANCELADO,
  ]),
});

export const PATCH = withRoleParams<Params>(
  ["Direccion", "Colaborador"],
  async (req, ctx, session) => {
    try {
      const { id } = PedidoIdParams.parse(await ctx.params);

      const body = ChangePedidoStatusSchema.parse(await req.json());

      const pedido = await changePedidoStatus(id, body.estatus, session.id);

      return ok(pedido);
    } catch (err) {
      return handleError(err);
    }
  }
);
