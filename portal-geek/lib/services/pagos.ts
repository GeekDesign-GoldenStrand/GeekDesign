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

  const isRefund = data.estatus_pago === "Reembolsado";

  // The per-order payment cap applies to regular payments. Refunds are corrective
  // entries and skip it so a fully-paid (or maxed-out) order can still be reversed.
  if (!isRefund) {
    const pagosCount = await prisma.pagos.count({ where: { id_pedido: data.id_pedido } });
    if (pagosCount >= MAX_PAGOS_POR_PEDIDO) {
      throw new ValidationError(
        `No se pueden registrar más de ${MAX_PAGOS_POR_PEDIDO} pagos para un pedido.`
      );
    }
  }

  // Net collected = sum of "Pagado" minus sum of "Reembolsado". Total cost = sum
  // of the order's line-item subtotals.
  const [detalleAgg, pagadoAgg, reembolsadoAgg] = await Promise.all([
    prisma.detallePedido.aggregate({
      _sum: { subtotal: true },
      where: { id_pedido: data.id_pedido },
    }),
    prisma.pagos.aggregate({
      _sum: { monto_pago: true },
      where: { id_pedido: data.id_pedido, estatus_pago: "Pagado" },
    }),
    prisma.pagos.aggregate({
      _sum: { monto_pago: true },
      where: { id_pedido: data.id_pedido, estatus_pago: "Reembolsado" },
    }),
  ]);
  const totalPedido = Number(detalleAgg._sum.subtotal ?? 0);
  const netoPagado =
    Number(pagadoAgg._sum.monto_pago ?? 0) - Number(reembolsadoAgg._sum.monto_pago ?? 0);

  if (isRefund) {
    // A refund needs something to reverse and can't exceed what's still collected.
    if (netoPagado <= 0) {
      throw new ValidationError("No hay pagos disponibles para reembolsar.");
    }
    if (data.monto_pago > netoPagado) {
      throw new ValidationError("El reembolso no puede superar lo pagado del pedido.");
    }
  } else if (totalPedido > 0 && netoPagado >= totalPedido) {
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
