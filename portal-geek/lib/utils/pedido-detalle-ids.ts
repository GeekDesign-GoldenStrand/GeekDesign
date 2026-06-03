export function parseDetalleIds(raw: string | undefined): number[] | null {
  if (!raw) return null;
  const ids = raw
    .split(",")
    .map(Number)
    .filter((n) => !isNaN(n) && n > 0);
  return ids.length ? ids : null;
}
