/** Returns true if `raw` is a valid in-progress decimal money input. */
export function isValidMoneyInput(raw: string): boolean {
  return raw === "" || /^\d{0,8}(\.\d{0,2})?$/.test(raw);
}

/** Returns true if `v` is a non-negative parseable number (final validation). */
export function isValidMoney(v: string): boolean {
  return !isNaN(parseFloat(v)) && parseFloat(v) >= 0;
}
