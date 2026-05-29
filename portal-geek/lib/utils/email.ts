import { z } from "zod";

// Practical RFC 5322 subset: local@domain.tld, no spaces, TLD >= 2 letters,
// and no leading, trailing, or consecutive dots in the local part.
const EMAIL_REGEX =
  /^(?!\.)(?!.*\.\.)[A-Za-z0-9_'+\-.]+(?<!\.)@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*\.[A-Za-z]{2,}$/;

export function isValidEmail(value: string): boolean {
  const v = value.trim();
  if (v.length === 0 || v.length > 254) return false;
  const [local] = v.split("@");
  if (!local || local.length > 64) return false;
  return EMAIL_REGEX.test(v);
}

export const EMAIL_ERROR_MESSAGE = "Ingresa un correo electrónico válido (ej. nombre@dominio.com)";

export function emailField(opts: { max?: number; message?: string } = {}) {
  const max = opts.max ?? 254;
  const message = opts.message ?? EMAIL_ERROR_MESSAGE;
  return z.string().trim().max(max).refine(isValidEmail, { message });
}
