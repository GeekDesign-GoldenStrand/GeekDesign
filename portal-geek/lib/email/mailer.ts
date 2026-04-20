import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendMail({ to, subject, html }: SendMailOptions) {
  const from = process.env.RESEND_FROM_EMAIL ?? "Geek Design <noreply@geekdesign.mx>";
  const { error } = await resend.emails.send({ from, to, subject, html });
  if (error) throw new Error(`Error al enviar correo: ${error.message}`);
}
