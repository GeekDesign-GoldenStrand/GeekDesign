import { withSectionParams } from "@/lib/auth/guards";
import { SetAnticipoSchema } from "@/lib/schemas/pagos";
import { PedidoIdParams } from "@/lib/schemas/pedidos";
import { setPedidoAnticipo, notifyPaymentReady } from "@/lib/services/pagos";
import { ok } from "@/lib/utils/api";
import { handleError } from "@/lib/utils/errors";

type Params = { id: string };

// ST-17 §0 — Dirección fija el anticipo de un pedido y dispara el correo con el
// enlace de pago. Solo roles con escritura en "pedidos".
export const PATCH = withSectionParams<Params>("pedidos", "write", async (req, ctx) => {
  try {
    const { id } = PedidoIdParams.parse(await ctx.params);
    const { monto_anticipo } = SetAnticipoSchema.parse(await req.json());

    await setPedidoAnticipo(id, monto_anticipo);
    // Best-effort: el correo no debe bloquear la respuesta del guardado.
    await notifyPaymentReady(id);

    return ok({ id_pedido: id, monto_anticipo });
  } catch (err) {
    return handleError(err);
  }
});
