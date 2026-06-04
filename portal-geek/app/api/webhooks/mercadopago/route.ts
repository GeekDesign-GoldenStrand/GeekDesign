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

    // Mercado Pago envía notificaciones por dos canales: el sistema moderno
    // (v2) con `?data.id=&type=` + firma HMAC en x-signature, y el sistema
    // legado IPN con `?id=&topic=` sin firma. Solo el moderno es nuestra fuente
    // de verdad; ignoramos el IPN antes de verificar firma para no devolver
    // 401 sobre algo que no procesaremos igual.
    const isLegacyIpn = searchParams.has("topic") && !searchParams.has("data.id");
    if (isLegacyIpn) {
      return NextResponse.json({ data: null, error: null }, { status: 200 });
    }

    // En dev, MP firma las notificaciones de la per-preference notification_url
    // con una clave distinta a la que expone el panel, así que la verificación
    // de firma siempre falla. La autenticidad se reconfirma server-side al
    // re-consultar el pago contra MP con nuestro access token, por lo que en
    // dev confiamos en `data.id` y omitimos la verificación de firma.
    if (process.env.NODE_ENV === "production") {
      const valid = getPaymentProvider().verifyWebhookSignature({
        xSignature,
        xRequestId,
        dataId,
      });
      if (!valid) {
        return NextResponse.json({ data: null, error: "Firma inválida" }, { status: 401 });
      }
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
