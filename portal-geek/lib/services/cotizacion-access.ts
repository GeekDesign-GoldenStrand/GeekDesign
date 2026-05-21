import crypto from "node:crypto";

import { SignJWT, jwtVerify } from "jose";

import { prisma } from "@/lib/db/client";
import { sendMail } from "@/lib/email/mailer";
import { NotFoundError } from "@/lib/utils/errors";

// KIKW12 review #1b/#2 — magic-link access for the cotización tracker.
//
// Flow:
//   1. issueAccessToken: server generates a 32-byte raw token, stores its
//      SHA-256, emails the cliente a one-tap link.
//   2. consumeAccessToken: handler at GET /api/storefront/cotizaciones/access
//      verifies the hash, marks it used (single-use), and mints a short-lived
//      JWT bound to the id_cotizacion.
//   3. setSessionCookie / verifySessionCookie: HTTP-only signed cookie carries
//      the JWT. Approve / cancel / tracker-render all read it.

const TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes
const SESSION_TTL_SECONDS = 24 * 60 * 60; // 24 hours
const JWT_ALG = "HS256";
const SESSION_COOKIE = "cotizacion_session";

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET is not set or shorter than 32 characters");
  }
  return new TextEncoder().encode(secret);
}

function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

/**
 * Issue a magic-link token for a cotización and email the link to the cliente
 * on file. Caller already proved (via folio lookup + email match) that the
 * requester knows the cliente's email — this function is silent on failure to
 * avoid leaking which folios/emails exist.
 */
export async function issueAccessToken(params: {
  id_cotizacion: number;
  folio: string;
  correo_destino: string;
  nombre_cliente: string;
}): Promise<void> {
  const raw = crypto.randomBytes(32).toString("hex");
  const token_hash = hashToken(raw);
  const expira_en = new Date(Date.now() + TOKEN_TTL_MS);

  try {
    await prisma.tokensAccesoCotizacion.create({
      data: { id_cotizacion: params.id_cotizacion, token_hash, expira_en },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const accessUrl = `${appUrl}/api/storefront/cotizaciones/access?token=${raw}`;

    await sendMail({
      to: params.correo_destino,
      subject: `Tu cotización ${params.folio} — Geek Design`,
      html: buildAccessEmail(params.nombre_cliente, params.folio, accessUrl),
    });
  } catch (err) {
    // Log but never expose — same anti-enumeration posture as password-reset.
    console.error("[cotizacion-access] Failed to issue token:", (err as Error).message);
  }
}

/**
 * Consume a raw magic-link token. Returns id_cotizacion on success.
 * Throws NotFoundError on invalid/expired/used token (generic message so we
 * don't disclose which arm failed).
 */
export async function consumeAccessToken(raw: string): Promise<number> {
  const token_hash = hashToken(raw);
  const record = await prisma.tokensAccesoCotizacion.findUnique({
    where: { token_hash },
  });
  if (!record || record.usado || record.expira_en < new Date()) {
    throw new NotFoundError("El enlace de acceso es inválido o ya expiró");
  }
  await prisma.tokensAccesoCotizacion.update({
    where: { id: record.id },
    data: { usado: true },
  });
  return record.id_cotizacion;
}

export async function signSessionJWT(id_cotizacion: number): Promise<string> {
  return new SignJWT({ id_cotizacion })
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecret());
}

/**
 * Verify a session cookie JWT and confirm it grants access to the given
 * cotización. Returns true iff the JWT is valid AND its id_cotizacion matches.
 * The match prevents using a token issued for cotización A to act on B.
 */
export async function verifySessionFor(jwt: string, id_cotizacion: number): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(jwt, getSecret(), { algorithms: [JWT_ALG] });
    return typeof payload.id_cotizacion === "number" && payload.id_cotizacion === id_cotizacion;
  } catch {
    return false;
  }
}

/**
 * Decode a session cookie JWT and return the id_cotizacion it grants access to.
 * Returns null on any failure. Use this in the tracker page where the cotización
 * id is read FROM the cookie (rather than checked against a known id).
 */
export async function readSessionCotizacionId(jwt: string): Promise<number | null> {
  try {
    const { payload } = await jwtVerify(jwt, getSecret(), { algorithms: [JWT_ALG] });
    return typeof payload.id_cotizacion === "number" ? payload.id_cotizacion : null;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
export const SESSION_COOKIE_MAX_AGE = SESSION_TTL_SECONDS;

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildAccessEmail(nombre: string, folio: string, url: string): string {
  const year = new Date().getFullYear();
  const safeNombre = escapeHtml(nombre);
  const safeFolio = escapeHtml(folio);
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
        <tr><td style="padding:40px;">
          <h1 style="color:#333;font-size:22px;margin:0 0 16px;">Hola, ${safeNombre}</h1>
          <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 16px;">
            Tu cotización <strong>${safeFolio}</strong> está lista para que la consultes.
            Haz clic en el botón para ver el detalle, aprobarla o cancelarla.
          </p>
          <p style="text-align:center;margin:24px 0;">
            <a href="${url}"
              style="display:inline-block;background:#df2646;color:#ffffff;font-size:16px;font-weight:600;padding:14px 36px;border-radius:50px;text-decoration:none;letter-spacing:0.5px;">
              Ver mi cotización
            </a>
          </p>
          <p style="color:#888;font-size:13px;line-height:1.6;margin:0 0 8px;">
            Este enlace expira en <strong>30 minutos</strong> y solo puede usarse una vez.
            Si lo necesitas de nuevo, vuelve a solicitarlo en
            <a href="${escapeHtml(process.env.NEXT_PUBLIC_APP_URL ?? "")}/tienda/cotizacion" style="color:#df2646;">tienda/cotizacion</a>.
          </p>
          <p style="color:#bbb;font-size:12px;">
            O copia y pega esta URL:<br />
            <a href="${url}" style="color:#df2646;word-break:break-all;">${url}</a>
          </p>
        </td></tr>
        <tr><td style="background:#f5f5f5;padding:20px 40px;text-align:center;">
          <p style="color:#aaa;font-size:12px;margin:0;">© ${year} Geek Design. Todos los derechos reservados.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
