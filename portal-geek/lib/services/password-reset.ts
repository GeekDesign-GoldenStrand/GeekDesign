import crypto from "node:crypto";

import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db/client";
import { sendMail } from "@/lib/email/mailer";
import { NotFoundError } from "@/lib/utils/errors";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function makeToken(): { raw: string; hash: string } {
  const raw = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  return { raw, hash };
}

export async function requestPasswordReset(email: string): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();

  const usuario = await prisma.usuarios.findUnique({
    where: { correo_electronico: normalizedEmail },
  });

  // Always succeed silently — avoids leaking whether an email exists.
  if (!usuario || usuario.estatus !== "Activo") return;

  try {
    const { raw, hash } = makeToken();
    const expiraEn = new Date(Date.now() + TOKEN_TTL_MS);

    await prisma.tokensRecuperacion.upsert({
      where: { id_usuario: usuario.id_usuario },
      create: { id_usuario: usuario.id_usuario, token_hash: hash, expira_en: expiraEn },
      update: { token_hash: hash, expira_en: expiraEn, usado: false },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const resetUrl = `${appUrl}/api/auth/verify-reset?token=${raw}`;

    await sendMail({
      to: normalizedEmail,
      subject: "Recupera tu contraseña — Geek Design",
      html: buildResetEmail(usuario.nombre_completo, resetUrl),
    });
  } catch (err) {
    // Log but never expose — prevents account-enumeration via error responses.
    console.error("[password-reset] Failed to process reset request:", (err as Error).message);
  }
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  const passwordHash = await hashPassword(newPassword);

  await prisma.$transaction(async (tx) => {
    // Lock the token row so two simultaneous reset submissions can't both
    // pass the `!record.usado` check. Mirrors consumeAccessToken.
    await tx.$queryRaw`SELECT 1 FROM "TOKENS_RECUPERACION" WHERE token_hash = ${hash} FOR UPDATE`;

    const record = await tx.tokensRecuperacion.findUnique({
      where: { token_hash: hash },
    });

    if (!record || record.usado || record.expira_en < new Date()) {
      throw new NotFoundError("El enlace de recuperación es inválido o ya expiró");
    }

    await tx.usuarios.update({
      where: { id_usuario: record.id_usuario },
      data: { contrasena_hash: passwordHash },
    });

    await tx.tokensRecuperacion.update({
      where: { id: record.id },
      data: { usado: true },
    });
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildResetEmail(nombre: string, url: string): string {
  const year = new Date().getFullYear();
  const safeNombre = escapeHtml(nombre);
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
          <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px;">
            Recibimos una solicitud para restablecer la contraseña de tu cuenta.
            Haz clic en el botón de abajo para continuar.
          </p>
          <p style="text-align:center;margin:0 0 24px;">
            <a href="${url}"
              style="display:inline-block;background:#df2646;color:#ffffff;font-size:16px;font-weight:600;padding:14px 36px;border-radius:50px;text-decoration:none;letter-spacing:0.5px;">
              Restablecer contraseña
            </a>
          </p>
          <p style="color:#888;font-size:13px;line-height:1.6;margin:0 0 8px;">
            Este enlace expira en <strong>1 hora</strong>.
            Si no solicitaste este cambio, puedes ignorar este correo.
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

export async function sendWelcomeEmailForColaborador(
  id_usuario: number,
  email: string,
  nombre: string
): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const { raw, hash } = makeToken();
    const expiraEn = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours

    await prisma.tokensRecuperacion.upsert({
      where: { id_usuario },
      create: { id_usuario, token_hash: hash, expira_en: expiraEn },
      update: { token_hash: hash, expira_en: expiraEn, usado: false },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const resetUrl = `${appUrl}/api/auth/verify-reset?token=${raw}`;

    await sendMail({
      to: normalizedEmail,
      subject: "Bienvenido a Geek Design — Configura tu contraseña",
      html: buildWelcomeEmail(nombre, resetUrl),
    });
  } catch (err) {
    console.error("[welcome-email] Failed to send welcome email:", (err as Error).message);
    throw err;
  }
}

function buildWelcomeEmail(nombre: string, url: string): string {
  const year = new Date().getFullYear();
  const safeNombre = escapeHtml(nombre);
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
          <h1 style="color:#333;font-size:22px;margin:0 0 16px;">¡Hola, ${safeNombre}!</h1>
          <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px;">
            Se ha creado tu cuenta como colaborador en Geek Design.
            Haz clic en el botón de abajo para establecer tu contraseña y acceder al portal.
          </p>
          <p style="text-align:center;margin:0 0 24px;">
            <a href="${url}"
              style="display:inline-block;background:#df2646;color:#ffffff;font-size:16px;font-weight:600;padding:14px 36px;border-radius:50px;text-decoration:none;letter-spacing:0.5px;">
              Configurar contraseña
            </a>
          </p>
          <p style="color:#888;font-size:13px;line-height:1.6;margin:0 0 24px;word-break:break-all;">
            Si el botón no funciona, copia y pega este enlace en tu navegador:
            <br />
            <a href="${url}" style="color:#df2646;text-decoration:underline;">${url}</a>
          </p>
          <p style="color:#888;font-size:13px;line-height:1.6;margin:0 0 8px;">
            Este enlace expira en <strong>8 horas</strong>.
            Si no esperabas este correo, puedes ignorarlo.
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
