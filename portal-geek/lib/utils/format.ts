/**
 * Formats a 10-digit phone number string into "xxx xxx xxxx" format.
 * If the input is not 10 digits, it returns the input as is or partially formatted.
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return "";

  const digits = normalizePhone(phone);

  const isMetro = /^(55|33|81)/.test(digits);
  if (isMetro) {
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 2)} ${digits.slice(2, 6)}`;
    return `${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6, 10)}`;
  }

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3, 6)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)}`;
}

/**
 * Extracts the 10-digit national number from raw phone input. When a number is
 * pasted with the Mexican country code (e.g. "+52 1 272 703 3148" from WhatsApp),
 * strips the leading 52 and optional mobile 1 prefix instead of truncating the
 * tail, which would silently corrupt the number.
 */
export function normalizePhone(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.length > 10 && digits.startsWith("52")) {
    digits = digits.slice(2);
    if (digits.length > 10 && digits.startsWith("1")) {
      digits = digits.slice(1);
    }
  }
  return digits.slice(0, 10);
}

/**
 * Matches emoji glyphs *and* the invisible joiners / selectors / tag
 * characters that compose ZWJ, flag, keycap and subdivision sequences.
 *
 * `\p{Extended_Pictographic}` alone catches visible emoji but leaves orphaned
 * skin-tone modifiers (U+1F3FB-U+1F3FF), ZWJ (U+200D),
 * variation selectors (U+FE00-U+FE0F), the
 * combining enclosing keycap (U+20E3) and tag characters (U+E0020–E007F)
 * behind — all invisible, all still counted against length budgets and all
 * confusing to render. We strip them explicitly so the post-clean string is
 * actually free of emoji residue, not just the visible part.
 *
 * Two copies: the non-global form is for `.test()` (predicate use), the
 * global form for `.replace()`. Keeping a single literal would force callers
 * to remember to reset `lastIndex` between calls — a footgun we sidestep by
 * declaring both up front.
 */
// Built from a string so the explicit \u escapes survive editor / linter
// normalization unchanged. Each escape, in order: ZWJ (joins ZWJ sequences
// like 👨‍👩‍👧), Combining Enclosing Keycap (the box around 1️⃣), and the
// variation-selector range U+FE00–U+FE0F (text-vs-emoji presentation toggle).
// The second alternation covers Fitzpatrick skin-tone modifiers U+1F3FB-U+1F3FF.
// The third alternation covers Regional Indicator Symbols U+1F1E6-U+1F1FF
// (the halves of a country flag like 🇲🇽 — not classified as
// Extended_Pictographic on their own). The fourth covers tag characters
// U+E0020–U+E007F used by subdivision flags like 🏴󠁧󠁢󠁥󠁮󠁧󠁿.
const EMOJI_PATTERN =
  "[\\p{Extended_Pictographic}\\u200D\\u20E3\\uFE00-\\uFE0F]|[\\u{1F3FB}-\\u{1F3FF}]|[\\u{1F1E6}-\\u{1F1FF}]|[\\u{E0020}-\\u{E007F}]";
const EMOJI_RE = new RegExp(EMOJI_PATTERN, "u");
const EMOJI_RE_GLOBAL = new RegExp(EMOJI_PATTERN, "gu");

/**
 * Removes emoji and emoji-composition characters from a string. Used to keep
 * short identifier-like fields (machine model/nickname, etc.) ASCII-clean —
 * emoji code points would otherwise eat into the visible-character budget and
 * render inconsistently across the catalog UI.
 *
 * The frontend uses this on every `onChange` so the user can't *type* an
 * emoji into the input; the API layer pairs it with `containsEmoji` as a
 * hard `refine` so a hand-rolled request can't bypass the strip.
 */
export function stripEmoji(value: string): string {
  return value.replace(EMOJI_RE_GLOBAL, "");
}

/**
 * Predicate counterpart to `stripEmoji`. Used by Zod schemas (see
 * `lib/schemas/maquinas.ts`) to reject — not silently strip — payloads that
 * carry emoji on the backend. Sharing the regex with `stripEmoji` guarantees
 * the UI's "you can't type this" surface and the API's "I won't accept this"
 * surface can't drift out of sync.
 */
export function containsEmoji(value: string): boolean {
  return EMOJI_RE.test(value);
}

/**
 * Formats a date timestamp string into "dd MMM yyyy" format.
 */
export function formatDate(dateString: string): string {
  const MONTHS = [
    "ENE",
    "FEB",
    "MAR",
    "ABR",
    "MAY",
    "JUN",
    "JUL",
    "AGO",
    "SEP",
    "OCT",
    "NOV",
    "DIC",
  ];

  const date = new Date(dateString);
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = MONTHS[date.getUTCMonth()];
  const year = date.getUTCFullYear();

  return `${day} ${month} ${year}`;
}
