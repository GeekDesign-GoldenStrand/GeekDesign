import { sendMail } from "@/lib/email/mailer";
import type { PaymentProgress } from "@/lib/services/pagos";

// ST-17 — transactional emails for online payments (Mercado Pago).
// Same brand/markup conventions as lib/services/cotizacion-access.ts.

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const MXN = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

function shell(inner: string): string {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#fff8f9;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="500" cellpadding="0" cellspacing="0" role="presentation"
        style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.08);">
        <tr><td style="background:#8b434a;padding:28px 40px;text-align:center;">
          <span style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:1px;">GEEK DESIGN</span>
        </td></tr>
        <tr><td style="padding:40px;">${inner}</td></tr>
        <tr><td style="background:#f5f5f5;padding:20px 40px;text-align:center;">
          <p style="color:#aaa;font-size:12px;margin:0;">© ${year} Geek Design. Todos los derechos reservados.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/**
 * ST-17 §0 — sent when Dirección sets the anticipo; invites the client to pay
 * online. `url` is an authenticated magic link to the order tracker (createAccessLink).
 */
export async function sendPaymentLinkEmail(params: {
  to: string;
  nombre: string;
  folio: string;
  monto: number;
  url: string;
}): Promise<void> {
  const nombre = escapeHtml(params.nombre);
  const folio = escapeHtml(params.folio);
  const monto = MXN.format(params.monto);
  const inner = `
    <h1 style="color:#333;font-size:22px;margin:0 0 16px;">Hola, ${nombre}</h1>
    <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 16px;">
      Tu pedido <strong>${folio}</strong> está listo para pagar en línea.
      El anticipo a cubrir es de <strong>${monto}</strong>.
    </p>
    <p style="text-align:center;margin:24px 0;">
      <a href="${params.url}"
        style="display:inline-block;background:#df2646;color:#ffffff;font-size:16px;font-weight:600;padding:14px 36px;border-radius:50px;text-decoration:none;letter-spacing:0.5px;">
        Pagar con Mercado Pago
      </a>
    </p>
    <p style="color:#888;font-size:13px;line-height:1.6;margin:0;">
      Este enlace expira en 30 minutos y solo puede usarse una vez. Si lo
      necesitas de nuevo, búscalo con tu folio y correo en tienda/cotizacion.
    </p>`;
  await sendMail({
    to: params.to,
    subject: `Pago de tu pedido ${params.folio} — Geek Design`,
    html: shell(inner),
  });
}

/**
 * ST-17 §4 — payment receipt, sent after the webhook confirms an approved payment.
 */
export async function sendPaymentReceiptEmail(params: {
  to: string;
  nombre: string;
  folio: string;
  monto: number;
  progreso: PaymentProgress;
  saldoRestante: number;
}): Promise<void> {
  const nombre = escapeHtml(params.nombre);
  const folio = escapeHtml(params.folio);
  const monto = MXN.format(params.monto);
  const progreso = escapeHtml(params.progreso);
  const saldoLine =
    params.saldoRestante > 0
      ? `<p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 16px;">Saldo restante: <strong>${MXN.format(
          params.saldoRestante
        )}</strong>.</p>`
      : `<p style="color:#1a8d4c;font-size:15px;line-height:1.6;margin:0 0 16px;font-weight:600;">¡Tu pedido quedó pagado por completo!</p>`;
  const inner = `
    <h1 style="color:#333;font-size:22px;margin:0 0 16px;">Recibimos tu pago, ${nombre}</h1>
    <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 8px;">
      Confirmamos un pago de <strong>${monto}</strong> para tu pedido <strong>${folio}</strong>.
    </p>
    <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 16px;">
      Estado del pago: <strong>${progreso}</strong>.
    </p>
    ${saldoLine}
    <p style="color:#888;font-size:13px;line-height:1.6;margin:0;">
      Gracias por tu compra. Puedes consultar el estatus de tu pedido en
      cualquier momento con tu folio y correo en tienda/cotizacion.
    </p>`;
  await sendMail({
    to: params.to,
    subject: `Comprobante de pago — pedido ${params.folio}`,
    html: shell(inner),
  });
}
