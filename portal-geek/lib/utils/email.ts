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
