import type { Pagos, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/client";
import { sendPaymentLinkEmail, sendPaymentReceiptEmail } from "@/lib/email/payment";
import { getPaymentProvider } from "@/lib/payments";
import type { CreatePagoInput, UpdatePagoInput } from "@/lib/schemas/pagos";
import { createAccessLink } from "@/lib/services/cotizacion-access";
import { NotFoundError, ValidationError } from "@/lib/utils/errors";

// ─────────────────────────────────────────────────────────────────────────────
// ST-17 — Online payments with Mercado Pago (Checkout Pro).
//
// "Anticipo cubierto" / "Pago completo" is a DERIVED finance progress indicator
// (SRS §2.3.5), NOT a value of the EstatusPedidos production enum. We never
// mutate Pedidos.id_estatus here — payment progress is computed from the PAGOS
// rows plus Pedidos.monto_anticipo and the order total.
// ─────────────────────────────────────────────────────────────────────────────

export type PaymentProgress = "Pendiente" | "Anticipo cubierto" | "Pago completo";

/** What the next charge represents, for labels/emails. */
export type PaymentConcepto = "anticipo" | "saldo" | "completo";

export interface PedidoSaldo {
  id_pedido: number;
  folio: string;
  /** Σ subtotales del pedido. */
  total: number;
  /** Σ pagos con estatus_pago = "Pagado". */
  pagado: number;
  /** total − pagado (≥ 0). */
  saldo: number;
  /** Anticipo fijado por Dirección, o null si aún no se define. */
  anticipo: number | null;
  /** Monto que cobraría el próximo pago (anticipo o saldo). 0 si ya está cubierto. */
  montoDue: number;
  /** Concepto del próximo pago. */
  concepto: PaymentConcepto;
  /** Indicador de progreso financiero derivado. */
  progreso: PaymentProgress;
}

const PAGADO = "Pagado";
const METODO_MERCADOPAGO = "Mercado Pago";

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function appBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

// ── Existing CRUD (used by the admin "finanzas" routes / PE-04 manual pagos) ──

export async function listPagosByPedido(
  idPedido: number,
  page: number,
  pageSize: number
): Promise<{ items: Pagos[]; total: number }> {
  const where: Prisma.PagosWhereInput = { id_pedido: idPedido };
  const [items, total] = await Promise.all([
    prisma.pagos.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { fecha: "desc" },
    }),
    prisma.pagos.count({ where }),
  ]);
  return { items, total };
}

export async function getPago(id: number): Promise<Pagos> {
  const pago = await prisma.pagos.findUnique({ where: { id_pago: id } });
  if (!pago) throw new NotFoundError("Pago no encontrado");
  return pago;
}

export async function createPago(data: CreatePagoInput): Promise<Pagos> {
  return prisma.pagos.create({
    data: {
      id_pedido: data.id_pedido,
      monto_pago: data.monto_pago,
      metodo_pago: data.metodo_pago,
      referencia_mercadopago: data.referencia_mercadopago ?? null,
      estatus_pago: data.estatus_pago,
    },
  });
}

export async function updatePago(id: number, data: UpdatePagoInput): Promise<Pagos> {
  try {
    return await prisma.pagos.update({
      where: { id_pago: id },
      data: {
        estatus_pago: data.estatus_pago,
        referencia_mercadopago: data.referencia_mercadopago,
      },
    });
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && err.code === "P2025") {
      throw new NotFoundError("Pago no encontrado");
    }
    throw err;
  }
}

// ── Saldo / progreso ─────────────────────────────────────────────────────────

type PedidoForSaldo = Prisma.PedidosGetPayload<{
  include: { detalles: { select: { subtotal: true } }; pagos: true };
}>;

/** Σ subtotales de las líneas del pedido. */
function pedidoTotal(pedido: PedidoForSaldo): number {
  return round2(pedido.detalles.reduce((acc, d) => acc + Number(d.subtotal), 0));
}

/** Σ pagos confirmados (estatus_pago = "Pagado"). */
function pedidoPagado(pedido: PedidoForSaldo): number {
  return round2(
    pedido.pagos
      .filter((p) => p.estatus_pago === PAGADO)
      .reduce((acc, p) => acc + Number(p.monto_pago), 0)
  );
}

function deriveProgress(total: number, pagado: number, anticipo: number | null): PaymentProgress {
  if (total > 0 && pagado >= total) return "Pago completo";
  if (anticipo != null && anticipo > 0 && pagado >= anticipo) return "Anticipo cubierto";
  return "Pendiente";
}

/**
 * Compute the next amount due (D3): the first payment charges the anticipo set
 * by Dirección; later payments charge the remaining balance. If no anticipo was
 * set, the buyer pays the full balance in one go (MVP behavior).
 */
function computeSaldo(pedido: PedidoForSaldo, folio: string): PedidoSaldo {
  const total = pedidoTotal(pedido);
  const pagado = pedidoPagado(pedido);
  const anticipo = pedido.monto_anticipo != null ? Number(pedido.monto_anticipo) : null;
  const saldo = round2(Math.max(0, total - pagado));

  let montoDue: number;
  let concepto: PaymentConcepto;
  if (saldo <= 0) {
    montoDue = 0;
    concepto = "completo";
  } else if (pagado === 0 && anticipo != null && anticipo > 0 && anticipo < total) {
    montoDue = round2(anticipo);
    concepto = "anticipo";
  } else if (pagado > 0) {
    montoDue = saldo;
    concepto = "saldo";
  } else {
    montoDue = saldo;
    concepto = "completo";
  }

  return {
    id_pedido: pedido.id_pedido,
    folio,
    total,
    pagado,
    saldo,
    anticipo,
    montoDue,
    concepto,
    progreso: deriveProgress(total, pagado, anticipo),
  };
}

async function loadPedidoForCotizacion(id_cotizacion: number) {
  const cotizacion = await prisma.cotizaciones.findUnique({
    where: { id_cotizacion },
    select: {
      folio: true,
      pedido: {
        include: {
          detalles: { select: { subtotal: true } },
          pagos: true,
          cliente: { select: { nombre_cliente: true, correo_electronico: true } },
        },
      },
    },
  });

  if (!cotizacion || !cotizacion.pedido) {
    throw new NotFoundError("El pedido aún no está disponible para pago");
  }
  return { folio: cotizacion.folio ?? String(id_cotizacion), pedido: cotizacion.pedido };
}

/** ST-17 §1 — saldo del pedido asociado a una cotización (autorizada por cookie). */
export async function getSaldoByCotizacion(id_cotizacion: number): Promise<PedidoSaldo> {
  const { folio, pedido } = await loadPedidoForCotizacion(id_cotizacion);
  return computeSaldo(pedido, folio);
}

/** ST-17 §0 — Dirección fija (o actualiza) el anticipo del pedido. */
export async function setPedidoAnticipo(idPedido: number, monto: number): Promise<void> {
  try {
    await prisma.pedidos.update({
      where: { id_pedido: idPedido },
      data: { monto_anticipo: monto },
    });
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && err.code === "P2025") {
      throw new NotFoundError("Pedido no encontrado");
    }
    throw err;
  }
}

/**
 * ST-17 §0 — notifica al cliente que su pedido está listo para pagar en línea.
 * Mejor esfuerzo: registra el error pero no interrumpe el guardado del anticipo.
 * Envía un enlace mágico autenticado al tracker (D4, entrada A).
 */
export async function notifyPaymentReady(idPedido: number): Promise<void> {
  try {
    const cot = await prisma.cotizaciones.findFirst({
      where: { id_pedido: idPedido },
      orderBy: { fecha_creacion: "desc" },
      select: {
        id_cotizacion: true,
        folio: true,
        cliente: { select: { nombre_cliente: true, correo_electronico: true } },
      },
    });
    if (!cot?.folio) return;

    const saldo = await getSaldoByCotizacion(cot.id_cotizacion);
    if (saldo.montoDue <= 0) return;

    const url = await createAccessLink(cot.id_cotizacion);
    await sendPaymentLinkEmail({
      to: cot.cliente.correo_electronico,
      nombre: cot.cliente.nombre_cliente,
      folio: cot.folio,
      monto: saldo.montoDue,
      url,
    });
  } catch (err) {
    console.error("[pagos] No se pudo notificar pago listo:", (err as Error).message);
  }
}

/**
 * Resolve a folio to its cotización id, or null if not found. Used by storefront
 * payment routes to confirm the session cookie actually grants access to the
 * folio being paid (D8).
 */
export async function getCotizacionIdByFolio(folio: string): Promise<number | null> {
  const cot = await prisma.cotizaciones.findUnique({
    where: { folio },
    select: { id_cotizacion: true },
  });
  return cot?.id_cotizacion ?? null;
}

// ── Crear preferencia (Checkout Pro) ─────────────────────────────────────────

/**
 * ST-17 §2 — crea una preferencia de Mercado Pago para el próximo pago del
 * pedido. El monto se recalcula server-side (nunca se confía en el cliente).
 * external_reference = id_pedido para mapear el webhook de vuelta (D5).
 */
export async function createPreferenceByCotizacion(
  id_cotizacion: number
): Promise<{ initPoint: string; montoDue: number; concepto: PaymentConcepto }> {
  const { folio, pedido } = await loadPedidoForCotizacion(id_cotizacion);
  const saldo = computeSaldo(pedido, folio);

  if (saldo.montoDue <= 0) {
    throw new ValidationError("Este pedido ya está pagado por completo");
  }

  const base = appBaseUrl();
  const backUrl = `${base}/tienda/cotizacion/${encodeURIComponent(folio)}`;
  const conceptoLabel = saldo.concepto === "anticipo" ? "anticipo" : "pago";

  const { initPoint } = await getPaymentProvider().createPreference({
    externalReference: String(pedido.id_pedido),
    title: `Pedido ${folio} — ${conceptoLabel}`,
    amount: saldo.montoDue,
    payerEmail: pedido.cliente.correo_electronico,
    successUrl: `${backUrl}?pago=success`,
    pendingUrl: `${backUrl}?pago=pending`,
    failureUrl: `${backUrl}?pago=failure`,
    notificationUrl: `${base}/api/webhooks/mercadopago`,
  });

  return { initPoint, montoDue: saldo.montoDue, concepto: saldo.concepto };
}

// ── Webhook (fuente de verdad — D2, D6) ──────────────────────────────────────

/**
 * ST-17 §4 — procesa una notificación de pago de Mercado Pago.
 * Idempotente: si el payment id ya fue registrado, no duplica (D6).
 * Solo registra pagos aprobados; otros estados se ignoran (se espera la
 * notificación final). El cambio de progreso financiero es derivado, por lo
 * que NO se toca Pedidos.id_estatus.
 */
export async function processWebhookPayment(paymentId: string): Promise<void> {
  const payment = await getPaymentProvider().getPayment(paymentId);

  if (payment.status !== "approved") {
    // No es definitivo todavía — ignorar; Mercado Pago reenviará al aprobar.
    return;
  }

  if (!payment.externalReference) {
    throw new ValidationError("El pago no tiene external_reference (id_pedido)");
  }
  const idPedido = Number(payment.externalReference);
  if (!Number.isInteger(idPedido) || idPedido <= 0) {
    throw new ValidationError("external_reference inválido");
  }

  // Idempotencia (D6): si ya registramos este payment id, salir sin duplicar.
  const existing = await prisma.pagos.findUnique({
    where: { referencia_mercadopago: payment.id },
    select: { id_pago: true },
  });
  if (existing) return;

  const pedido = await prisma.pedidos.findUnique({
    where: { id_pedido: idPedido },
    include: {
      detalles: { select: { subtotal: true } },
      pagos: true,
      cliente: { select: { nombre_cliente: true, correo_electronico: true } },
      cotizaciones: { select: { folio: true }, orderBy: { fecha_creacion: "desc" }, take: 1 },
    },
  });
  if (!pedido) {
    throw new NotFoundError(`Pedido ${idPedido} no encontrado`);
  }

  // Registrar el pago. La restricción UNIQUE en referencia_mercadopago hace de
  // segunda barrera ante una notificación concurrente (la create fallaría con
  // P2002, que tratamos como "ya procesado").
  try {
    await prisma.pagos.create({
      data: {
        id_pedido: idPedido,
        monto_pago: payment.amount,
        metodo_pago: METODO_MERCADOPAGO,
        referencia_mercadopago: payment.id,
        estatus_pago: PAGADO,
      },
    });
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && err.code === "P2002") {
      return; // carrera: otra entrega del webhook ya lo registró
    }
    throw err;
  }

  const folio = pedido.cotizaciones[0]?.folio ?? String(idPedido);
  // Recalcular progreso ya con el nuevo pago incluido.
  const pagadoConNuevo = round2(
    pedido.pagos
      .filter((p) => p.estatus_pago === PAGADO)
      .reduce((acc, p) => acc + Number(p.monto_pago), 0) + payment.amount
  );
  const total = round2(pedido.detalles.reduce((acc, d) => acc + Number(d.subtotal), 0));
  const anticipo = pedido.monto_anticipo != null ? Number(pedido.monto_anticipo) : null;
  const progreso = deriveProgress(total, pagadoConNuevo, anticipo);

  // Comprobante por correo (no bloquea la confirmación del webhook si falla).
  try {
    await sendPaymentReceiptEmail({
      to: pedido.cliente.correo_electronico,
      nombre: pedido.cliente.nombre_cliente,
      folio,
      monto: payment.amount,
      progreso,
      saldoRestante: round2(Math.max(0, total - pagadoConNuevo)),
    });
  } catch (err) {
    console.error("[pagos] No se pudo enviar el comprobante:", (err as Error).message);
  }
}
