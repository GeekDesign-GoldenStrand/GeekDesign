import type { KeyboardEvent } from "react";

// Safari < 17 (still common on macOS 14 / iOS 16) does NOT enforce
// `type="number"` at the keystroke layer, so letters land in the field
// even though the HTML spec says they shouldn't. These helpers add a
// strict allowlist to onKeyDown + onPaste so number inputs behave the
// same across Safari 16, Safari 17+, Chrome, and Firefox.

interface Options {
  allowDecimal: boolean;
}

export function isAllowedNumericKey(e: KeyboardEvent<HTMLInputElement>, opts: Options): boolean {
  if (e.ctrlKey || e.metaKey || e.altKey) return true;
  if (e.key.length > 1) return true;
  if (e.key >= "0" && e.key <= "9") return true;
  if (opts.allowDecimal && (e.key === "." || e.key === ",")) return true;
  return false;
}

export function isAllowedNumericPaste(text: string, opts: Options): boolean {
  return opts.allowDecimal ? /^\d*[.,]?\d*$/.test(text) : /^\d+$/.test(text);
}
