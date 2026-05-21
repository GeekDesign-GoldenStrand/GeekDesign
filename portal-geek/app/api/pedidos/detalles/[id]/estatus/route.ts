import { z } from "zod";

import { withRoleParams } from "@/lib/auth/guards";
import { DetallePedidoIdParams } from "@/lib/schemas/pedidos";
import { changeDetallePedidoStatus, PEDIDO_STATUS } from "@/lib/services/pedidos";
import { ok } from "@/lib/utils/api";
import { handleError } from "@/lib/utils/errors";

type Params = { id: string };

const ChangeDetallePedidoStatusSchema = z.object({
  estatus: z.enum([
    PEDIDO_STATUS.PENDIENTE,
    PEDIDO_STATUS.EN_PRODUCCION,
    PEDIDO_STATUS.FINALIZADO,
    PEDIDO_STATUS.ENTREGADO,
    PEDIDO_STATUS.CANCELADO,
  ]),
});

export const PATCH = withRoleParams<Params>(["Direccion", "Colaborador"], async (req, ctx) => {
  try {
    const { id } = DetallePedidoIdParams.parse(await ctx.params);

    const body = ChangeDetallePedidoStatusSchema.parse(await req.json());

    const detalle = await changeDetallePedidoStatus(id, body.estatus);

    return ok(detalle);
  } catch (err) {
    return handleError(err);
  }
});
