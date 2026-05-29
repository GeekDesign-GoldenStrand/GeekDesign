const SAFE_TEXT_PATTERN = /[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9\s.,;:()¿?¡!%'"\/#&-]/g;
const MULTIPLE_SPACES_PATTERN = /\s+/g;

export function sanitizeSafeText(value: string, maxLength = 255): string {
  return value
    .normalize("NFKC")
    .replace(SAFE_TEXT_PATTERN, "")
    .replace(MULTIPLE_SPACES_PATTERN, " ")
    .slice(0, maxLength);
}
