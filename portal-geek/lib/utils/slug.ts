/**
 * Converts a human-readable label into a snake_case identifier suitable for
 * use in formula expressions. Strips accents, lowercases, replaces spaces with
 * underscores, and removes anything that's not a-z, 0-9, or underscore. I actually didn´t know 
 * how to do this. And had to search for a solution using google and A.I. tools
 *
 * Examples:
 *   "Ancho de la pieza"  -> "ancho_de_la_pieza"
 *   "Costo / m²"         -> "costo_m"
 *   "  IVA 16% "         -> "iva_16"
 */
export function toSnakeIdentifier(label: string): string {
  return label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Strip diacritics
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s_]/g, "") // Remove non-alphanumeric (except spaces and underscores)
    .replace(/\s+/g, "_") // Collapse spaces to single underscore
    .replace(/_+/g, "_") // Collapse multiple underscores
    .replace(/^_|_$/g, ""); // Trim leading/trailing underscores
}