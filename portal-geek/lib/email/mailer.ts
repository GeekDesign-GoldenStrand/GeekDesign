import { Resend } from "resend";

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendMail({ to, subject, html }: SendMailOptions) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[DEV MAIL] RESEND_API_KEY no configurada. Simulando envío a: ${to}`);
      console.warn(`[DEV MAIL CONTENT]:\n${html}`);
      return;
    }
    throw new Error("RESEND_API_KEY is not set");
  }

  const resend = new Resend(apiKey);
  const from = process.env.RESEND_FROM_EMAIL ?? "Geek Design <noreply@geekdesign.mx>";

  const { error } = await resend.emails.send({ from, to, subject, html });

  if (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[DEV MAIL] Resend falló (${error.message}). Simulando envío a: ${to}`);
      console.warn(`[DEV MAIL CONTENT]:\n${html}`);
      return;
    }
    throw new Error(`Error al enviar correo: ${error.message}`);
  }
}
