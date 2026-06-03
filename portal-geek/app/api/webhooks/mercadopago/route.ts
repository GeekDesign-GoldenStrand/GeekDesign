import { NextResponse, type NextRequest } from "next/server";

import { getPaymentProvider } from "@/lib/payments";
import { processWebhookPayment } from "@/lib/services/pagos";
import { handleError } from "@/lib/utils/errors";

// ST-17 §4 — Mercado Pago payment webhook (fuente de verdad — D2).
//
// Público pero autenticado por firma HMAC (x-signature). El handler es
// idempotente (D6) y solo registra pagos aprobados. Devolvemos 200 en los casos
// manejados/ignorados para que Mercado Pago no reintente; los errores
// inesperados caen a 500 (handleError) y Mercado Pago reintenta.
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // El cuerpo puede venir vacío en algunos pings; toleramos JSON inválido.
    let body: { type?: string; action?: string; data?: { id?: string | number } } = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    // El id del recurso (payment id) viaja en la query `data.id` (lo usa el
    // manifest de la firma) y/o en el cuerpo.
    const dataId =
      searchParams.get("data.id") ?? (body.data?.id != null ? String(body.data.id) : null);

    const xSignature = req.headers.get("x-signature");
    const xRequestId = req.headers.get("x-request-id");

    const valid = getPaymentProvider().verifyWebhookSignature({
      xSignature,
      xRequestId,
      dataId,
    });
    if (!valid) {
      return NextResponse.json({ data: null, error: "Firma inválida" }, { status: 401 });
    }

    // Solo nos interesan notificaciones de pago.
    const isPayment = body.type === "payment" || (body.action ?? "").startsWith("payment");
    if (!isPayment || !dataId) {
      return NextResponse.json({ data: null, error: null }, { status: 200 });
    }

    await processWebhookPayment(dataId);
    return NextResponse.json({ data: null, error: null }, { status: 200 });
  } catch (err) {
    return handleError(err);
  }
}
