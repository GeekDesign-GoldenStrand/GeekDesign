// Regex that matches emoji presentation characters. Uses Unicode property
// escapes to avoid maintaining a manual list. Returns true when string
// does NOT contain emojis.
const EMOJI_REGEX = /\p{Emoji_Presentation}/u;

export function noEmoji(value: string) {
  // empty values should be handled by the caller's min()/optional() rules
  if (value === undefined || value === null) return true;
  return !EMOJI_REGEX.test(value);
}

// Allow English/Spanish letters, digits, spaces and a set of common
// punctuation characters used across the app UI (including ºª and inverted
// punctuation used in Spanish). The `u` flag enables Unicode processing.
export const TEXT_ONLY_REGEX = /^[a-zA-Z0-9áéíóúüñÁÉÍÓÚÜÑ\s.,\-_#\/()'"@&+;:ºª!¡?¿]*$/u;
export function textOnly(value: string) {
  if (value === undefined || value === null) return true;
  return TEXT_ONLY_REGEX.test(value);
}

// Address regex mirrors the more permissive patterns already used in
// proveedores/instaladores (keeps # ° @ : / etc). Exported for reuse.
export const ADDRESS_REGEX = /^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑÀ-ÿ0-9.,\-'#°/()\s_&@:;"+ºª]*$/u;
export function addressOnly(value: string) {
  if (value === undefined || value === null) return true;
  return ADDRESS_REGEX.test(value);
}

// Convenience Zod refinements so callers can do `.refine(noEmoji, {message})`
export const noEmojiRefine = (_msg?: string) => (v: string) => noEmoji(v);

const textValidation = {
  noEmoji,
  textOnly,
  addressOnly,
};

export { textValidation };
