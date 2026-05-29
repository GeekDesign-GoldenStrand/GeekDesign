import type { ConstanteDraft } from "@/components/admin/servicios/molecules/ConstantesSection";
import type { VariableDraft } from "@/components/admin/servicios/molecules/VariablesSection";
import type { FormulaChunk, NuevoServicioFormState, ServicioAdminDetalle } from "@/types/servicios";
import { initialNuevoServicioState } from "@/types/servicios";

// ── Formula chunk reconstruction ──────────────────────────────────────────
// Given an expression string and a sorted list of known token identifiers,
// produces the alternating [text, token, text, ...] chunks array that
// FormulaSection expects.

function buildFormulaChunks(
  expresion: string,
  tokens: Array<{ value: string; immutable?: boolean }>
): FormulaChunk[] {
  // Longest-first to avoid partial-match bugs (e.g. "abc" vs "abcd").
  const sorted = [...tokens].sort((a, b) => b.value.length - a.value.length);

  const chunks: FormulaChunk[] = [];
  let remaining = expresion;

  while (remaining.length > 0) {
    let earliestIdx = remaining.length;
    let match: (typeof sorted)[0] | null = null;

    for (const token of sorted) {
      const idx = remaining.indexOf(token.value);
      if (idx !== -1 && idx < earliestIdx) {
        earliestIdx = idx;
        match = token;
      }
    }

    if (!match) {
      chunks.push({ type: "text", value: remaining });
      remaining = "";
    } else {
      chunks.push({ type: "text", value: remaining.slice(0, earliestIdx) });
      chunks.push({
        type: "token",
        value: match.value,
        ...(match.immutable ? { immutable: true } : {}),
      });
      remaining = remaining.slice(earliestIdx + match.value.length);
    }
  }

  if (chunks.length === 0) return [{ type: "text", value: "" }];
  if (chunks[chunks.length - 1].type === "token") chunks.push({ type: "text", value: "" });
  if (chunks[0].type === "token") chunks.unshift({ type: "text", value: "" });

  return chunks;
}

// ── Outgoing payload helpers ──────────────────────────────────────────────

// The form keeps a synthetic "global" constant for the implicit IVA chip
// (lib/utils/formula-evaluator.ts injects `iva` automatically in buildScope).
// These UI-only placeholders must NOT be sent to the API: the schema rejects
// reserved identifiers like "iva", and the evaluator throws on origen=global.
export function stripUiOnlyConstants(constantes: ConstanteDraft[]): ConstanteDraft[] {
  return constantes.filter((c) => c.origen !== "global");
}

// ── Main mapper ───────────────────────────────────────────────────────────

export function mapServicioDetalladoToFormState(
  servicio: ServicioAdminDetalle
): NuevoServicioFormState {
  const formula = servicio.formulaActiva;

  const variables: VariableDraft[] = (formula?.variables ?? []).map((v) => ({
    id_tipo_variable: v.id_tipo_variable,
    nombre_variable: v.nombre_variable,
    etiqueta: v.etiqueta,
    valor_default: v.valor_default ?? undefined,
    editable_por_cliente: v.editable_por_cliente,
    unidad: v.unidad ?? undefined,
  }));

  // Only global/manual constantes become ConstanteDraft chips.
  // instalador/proveedor constantes are inferred from id_instalador/id_proveedor.
  const constantes: ConstanteDraft[] = (formula?.constantes ?? [])
    .filter((c) => c.origen === "global" || c.origen === "manual")
    .map((c) => ({
      nombre_constante: c.nombre_constante,
      origen: c.origen as "global" | "manual",
      valor: c.valor !== null ? Number(c.valor) : undefined,
    }));

  // IVA must always be present.
  if (!constantes.some((c) => c.nombre_constante === "iva")) {
    constantes.unshift({ nombre_constante: "iva", origen: "global", valor: 0.16 });
  }

  // Build all token identifiers so we can reconstruct chunks from the expression.
  const tokenList: Array<{ value: string; immutable?: boolean }> = [
    ...variables.map((v) => ({ value: v.nombre_variable })),
    ...constantes.map((c) => ({
      value: c.nombre_constante,
      immutable: c.origen === "global",
    })),
    ...(servicio.id_instalador !== null ? [{ value: "costo_instalador" }] : []),
    ...(servicio.id_proveedor !== null ? [{ value: "costo_proveedor" }] : []),
  ];

  const formulaChunks: FormulaChunk[] =
    formula && formula.expresion.trim().length > 0
      ? buildFormulaChunks(formula.expresion, tokenList)
      : initialNuevoServicioState.formulaChunks;

  const materiales = servicio.materiales.map((m) => ({
    id_material: m.id_material,
    id_proveedor_precio: m.id_proveedor_precio,
  }));

  return {
    nombre_servicio: servicio.nombre_servicio,
    descripcion_servicio: servicio.descripcion_servicio ?? "",
    id_sucursal: servicio.id_sucursal,
    id_maquinas: servicio.maquinas.map((m) => m.maquina.id_maquina),
    id_instalador: servicio.id_instalador,
    costo_instalador_override:
      servicio.costo_instalador_override !== null
        ? Number(servicio.costo_instalador_override)
        : null,
    id_proveedor: servicio.id_proveedor,
    costo_proveedor_override:
      servicio.costo_proveedor_override !== null ? Number(servicio.costo_proveedor_override) : null,
    materialesEnabled: materiales.length > 0,
    materiales,
    formulaChunks,
    variables,
    constantes,
    imagenes: servicio.imagenes,
  };
}
