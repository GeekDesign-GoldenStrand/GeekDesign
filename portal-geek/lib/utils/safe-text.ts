// Characters NOT allowed in user-facing names (servicio, variable, constante
// labels). Anything matching — emojis, kaomoji building blocks (°, ╯, ┻, ▽…),
// decorative symbols, control chars — gets stripped on input so the field
// stays plain text.
//
// Allowed:
//   letters (ASCII + Spanish: áéíóúÁÉÍÓÚñÑüÜ)
//   digits 0-9
//   space
//   explicit punctuation: ! " # $ % & / ( ) = [ ] ? ¿ ¡
//   common punctuation:   . , ; : - _ ' + *
const DISALLOWED_NAME_CHARS = /[^A-Za-z0-9áéíóúÁÉÍÓÚñÑüÜ¡¿!"#$%&/()=?,;:.'+*\[\]_\- ]/gu;

// Strips emojis, kaomoji-only symbols, and other decorative unicode from a
// user-typed name. Normalizes to NFC first so decomposed accents (e + combining
// acute) survive as their composed form (é).
export function sanitizeUserText(input: string): string {
  return input.normalize("NFC").replace(DISALLOWED_NAME_CHARS, "");
}

// Rejects names where the same word appears 4+ times (e.g. "test test test test").
// Catches lazy/spam input that sanitizeUserText can't filter at the character
// level. Used in useServicioForm.handleSubmit and the variable/constante add
// flows before the value is accepted into form state.
export function repeatedWords(input: string): boolean {
  const words = input.toLowerCase().split(/\s+/);
  const wordCounts: Record<string, number> = {};
  for (const word of words) {
    if (word) {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
      if (wordCounts[word] > 3) return true;
    }
  }
  return false;
}
