import { z } from "zod";

// Practical RFC 5322 subset: local@dominio.tld, sin espacios, TLD ≥ 2 letras,
// rechaza puntos al inicio/fin o consecutivos en el local-part.
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

// Single source of truth para validación de email en backend (Zod) y frontend.
// Envuelve isValidEmail en un refine() para que los schemas Zod rechacen las
// mismas direcciones que rechaza el form del cliente — un cliente no-browser
// que llame la API directo no puede pasar pepe@dominio aunque z.string().email()
// lo aceptaría.
export function emailField(opts: { max?: number; message?: string } = {}) {
  const max = opts.max ?? 254;
  const message = opts.message ?? EMAIL_ERROR_MESSAGE;
  return z.string().trim().max(max).refine(isValidEmail, { message });
}
