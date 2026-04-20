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

  const { raw, hash } = makeToken();
  const expiraEn = new Date(Date.now() + TOKEN_TTL_MS);

  await prisma.tokensRecuperacion.upsert({
    where: { id_usuario: usuario.id_usuario },
    create: { id_usuario: usuario.id_usuario, token_hash: hash, expira_en: expiraEn },
    update: { token_hash: hash, expira_en: expiraEn, usado: false },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const resetUrl = `${appUrl}/cambiar-contrasena?token=${raw}`;

  await sendMail({
    to: normalizedEmail,
    subject: "Recupera tu contraseña — Geek Design",
    html: buildResetEmail(usuario.nombre_completo, resetUrl),
  });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const hash = crypto.createHash("sha256").update(token).digest("hex");

  const record = await prisma.tokensRecuperacion.findUnique({
    where: { token_hash: hash },
  });

  if (!record || record.usado || record.expira_en < new Date()) {
    throw new NotFoundError("El enlace de recuperación es inválido o ya expiró");
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.$transaction([
    prisma.usuarios.update({
      where: { id_usuario: record.id_usuario },
      data: { contrasena_hash: passwordHash },
    }),
    prisma.tokensRecuperacion.update({
      where: { id: record.id },
      data: { usado: true },
    }),
  ]);
}

function buildResetEmail(nombre: string, url: string): string {
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
        <tr><td style="padding:40px;">
          <h1 style="color:#333;font-size:22px;margin:0 0 16px;">Hola, ${nombre}</h1>
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
