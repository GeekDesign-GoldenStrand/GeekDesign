import { withSectionParams } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/client";
import { ok } from "@/lib/utils/api";
import { handleError, NotFoundError } from "@/lib/utils/errors";

type Params = { id: string };

export const PATCH = withSectionParams<Params>("finanzas", "write", async (_req, ctx) => {
  try {
    const { id } = await ctx.params;
    const idPedido = Number(id);

    const estadoFacturado = await prisma.estadoFacturaPedido.findUnique({
      where: { descripcion: "Facturado" },
    });
    if (!estadoFacturado) throw new NotFoundError("Estado 'Facturado' no encontrado en catálogo");

    const pedido = await prisma.pedidos.update({
      where: { id_pedido: idPedido, factura: true },
      data: {
        facturado: true,
        id_estado_factura: estadoFacturado.id_estado_factura,
      },
      select: { id_pedido: true, facturado: true },
    });

    return ok(pedido);
  } catch (err) {
    return handleError(err);
  }
});
