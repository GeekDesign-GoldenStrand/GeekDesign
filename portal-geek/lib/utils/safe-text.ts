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

export function excessiveSymbols(input: string): boolean {
  // Check for excessive use of symbols (e.g., multiple consecutive special characters)
  const symbolCount = (input.match(/[^A-Za-z0-9áéíóúÁÉÍÓÚñÑüÜ¡¿!"#$%&/()=?,;:.'+*\[\]_\- ]/g) || [])
    .length;
  const totalLength = input.length;
  return totalLength > 0 && symbolCount / totalLength > 0.3; // More than 30% of the string consists of symbols
}

export function repeatedWords(input: string): boolean {
  // Check for repeated words (e.g., "service service service")
  const words = input.toLowerCase().split(/\s+/);
  const wordCounts: Record<string, number> = {};
  for (const word of words) {
    if (word) {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
      if (wordCounts[word] > 3) {
        // More than 3 occurrences of the same word
        return true;
      }
    }
  }
  return false;
}

export function randomPatterns(input: string): boolean {
  // Check for random patterns (e.g., "asdf1234!@#$") or repeated characters (e.g., "!!!!!!" or "abcabcabc")
  const hasRepeatedChars = /(.)\1{4,}/.test(input); // 5 or more of the same character in a row
  const hasRandomPattern = /([a-zA-Z0-9]{4,}|[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{4,})/.test(
    input
  ); // 4 or more consecutive letters/digits or symbols
  return hasRepeatedChars || hasRandomPattern;
}
