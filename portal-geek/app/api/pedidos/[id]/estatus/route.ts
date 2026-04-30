import { NextResponse } from "next/server";

import { withRoleParams } from "@/lib/auth/guards";
import { PedidoIdParams } from "@/lib/schemas/pedidos";
import { changePedidoStatus, PEDIDO_STATUS } from "@/lib/services/pedidos";
import { handleError } from "@/lib/utils/errors";

export const PATCH = withRoleParams<{ id: string }>(["Direccion"], async (req, ctx, session) => {
  try {
    const { id: pedidoId } = PedidoIdParams.parse(await ctx.params);

    const body = await req.json();
    const newStatus = body.estatus;

    // Validate against catalog
    if (!Object.values(PEDIDO_STATUS).includes(newStatus)) {
      return handleError(new Error("Invalid pedido status"));
    }

    const updated = await changePedidoStatus(pedidoId, newStatus, session.id);
    return NextResponse.json(updated);
  } catch (err) {
    return handleError(err);
  }
});
