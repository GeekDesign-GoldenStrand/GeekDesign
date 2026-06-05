import { withSectionParams } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/client";
import { ok } from "@/lib/utils/api";
import { handleError, NotFoundError } from "@/lib/utils/errors";

type Params = { id: string };

export const PATCH = withSectionParams<Params>("finanzas", "write", async (req, ctx) => {
  try {
    const { id } = await ctx.params;
    const idPedido = Number(id);

    const body = await req.json().catch(() => ({}));
    const numeroFactura: string | undefined =
      typeof body?.numero_factura === "string" && body.numero_factura.trim()
        ? body.numero_factura.trim()
        : undefined;

    const estadoFacturado = await prisma.estadoFacturaPedido.findUnique({
      where: { descripcion: "Facturado" },
    });
    if (!estadoFacturado) throw new NotFoundError("Estado 'Facturado' no encontrado en catálogo");

    const pedido = await prisma.pedidos.update({
      where: { id_pedido: idPedido, factura: true },
      data: {
        facturado: true,
        id_estado_factura: estadoFacturado.id_estado_factura,
        ...(numeroFactura ? { numero_factura: numeroFactura } : {}),
      },
      select: { id_pedido: true, facturado: true, numero_factura: true },
    });

    return ok(pedido);
  } catch (err) {
    return handleError(err);
  }
});
