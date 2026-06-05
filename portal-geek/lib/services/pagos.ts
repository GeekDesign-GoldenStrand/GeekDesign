import type { Pagos } from "@prisma/client";

import { prisma } from "@/lib/db/client";
import { MAX_PAGOS_POR_PEDIDO } from "@/lib/schemas/pagos";
import type { CreatePagoInput, UpdatePagoInput } from "@/lib/schemas/pagos";
import { NotFoundError, ValidationError } from "@/lib/utils/errors";

export async function listPagosByPedido(
  idPedido: number,
  page: number,
  pageSize: number
): Promise<{ items: Pagos[]; total: number }> {
  // TODO: implement — filter by id_pedido
  void prisma;
  void idPedido;
  void page;
  void pageSize;
  throw new Error("Not implemented");
}

export async function getPago(id: number): Promise<Pagos> {
  // TODO: implement — throw new NotFoundError(...) if not found
  void id;
  throw new Error("Not implemented");
}

export async function createPago(data: CreatePagoInput): Promise<Pagos> {
  // Validate the FK up front so a missing pedido surfaces as a clean 404 instead
  // of a raw Prisma foreign-key violation.
  const pedido = await prisma.pedidos.findUnique({
    where: { id_pedido: data.id_pedido },
    select: { id_pedido: true },
  });
  if (!pedido) throw new NotFoundError("Pedido no encontrado");

  // Enforce the per-order payment cap server-side so the API can't be bypassed.
  const pagosCount = await prisma.pagos.count({ where: { id_pedido: data.id_pedido } });
  if (pagosCount >= MAX_PAGOS_POR_PEDIDO) {
    throw new ValidationError(
      `No se pueden registrar más de ${MAX_PAGOS_POR_PEDIDO} pagos para un pedido.`
    );
  }

  // Block new payments once the order is fully covered: total cost = sum of its
  // line-item subtotals; amount paid = sum of "Pagado" payments.
  const [detalleAgg, pagadoAgg] = await Promise.all([
    prisma.detallePedido.aggregate({
      _sum: { subtotal: true },
      where: { id_pedido: data.id_pedido },
    }),
    prisma.pagos.aggregate({
      _sum: { monto_pago: true },
      where: { id_pedido: data.id_pedido, estatus_pago: "Pagado" },
    }),
  ]);
  const totalPedido = Number(detalleAgg._sum.subtotal ?? 0);
  const totalPagado = Number(pagadoAgg._sum.monto_pago ?? 0);
  if (totalPedido > 0 && totalPagado >= totalPedido) {
    throw new ValidationError(
      "El pedido ya está totalmente pagado. No se pueden registrar más pagos."
    );
  }

  return prisma.pagos.create({
    data: {
      id_pedido: data.id_pedido,
      monto_pago: data.monto_pago,
      metodo_pago: data.metodo_pago,
      estatus_pago: data.estatus_pago,
      referencia_mercadopago: data.referencia_mercadopago ?? null,
    },
  });
}

export async function updatePago(id: number, data: UpdatePagoInput): Promise<Pagos> {
  // TODO: implement — throw NotFoundError on Prisma P2025
  void id;
  void data;
  throw new Error("Not implemented");
}
