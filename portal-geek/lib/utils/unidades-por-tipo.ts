// Maps each tipo de variable (by display name from TiposVariable.nombre_tipo)
// to the set of unit values that make sense for it. Used by the Variables and
// Constantes forms to filter the "Unidad" dropdown based on the selected tipo
// — so an admin can't accidentally pick "$" for a "Dimensión".
//
// Keys match the seed in prisma/seed.ts. Values match the short symbols stored
// in FormulaVariables.unidad.
const UNIDADES_POR_TIPO: Record<string, readonly string[]> = {
  Dimensión: ["mm", "mm²", "cm", "cm²", "m", "m²"],
  Cantidad: ["pz", "u"],
  "Costo adicional": ["$"],
  "Costo de material": ["$"],
  Descuento: ["%"],
  Tiempo: ["ms", "s", "min", "h"],
};

// Returns the allowed unit values for a tipo by name, or null when the tipo
// is unknown (callers should fall back to showing all units in that case).
export function unidadesParaTipo(nombreTipo: string | undefined | null): readonly string[] | null {
  if (!nombreTipo) return null;
  return UNIDADES_POR_TIPO[nombreTipo] ?? null;
}
