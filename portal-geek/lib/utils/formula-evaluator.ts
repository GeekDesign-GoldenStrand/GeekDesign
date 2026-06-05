import { Parser } from "expr-eval";

import { EvaluatorError } from "@/lib/utils/errors";

// Identifiers that the evaluator always injects into scope.
// Variables and constantes cannot reuse these names — see buildScope guard.
//
// `precio_material` and `velocidad_avance` are *polymorphic* material tokens:
// they resolve to the corresponding property of whichever material the
// customer picked at quotation time.
export const RESERVED_IDENTIFIERS = [
  "precio_material",
  "velocidad_avance",
  "costo_instalador",
  "costo_proveedor",
  "iva",
] as const;

export const IVA_MX = 0.16;

export type ConstanteOrigen = "manual" | "instalador" | "proveedor" | "maquina" | "global";

export interface EvaluatorVariable {
  nombre_variable: string;
  valor: number;
}

export interface EvaluatorConstante {
  nombre_constante: string;
  origen: ConstanteOrigen | string;
  valor: number | null;
  instalador: { costo_instalacion: number } | null;
  proveedor: { costo: number | null } | null;
}

export interface EvaluatorImplicits {
  // Polymorphic — adopts the value of the material the customer chose.
  precio_material: number;
  velocidad_avance: number;
  costo_instalador: number;
  costo_proveedor: number;
  // Per-material slug tokens (e.g. `costo_material_mdf_3mm`) injected by the
  // pricing layer based on the customer's selected material — that's how
  // FormulaSection's material chip identifiers resolve at evaluation time.
  [key: string]: number;
}

export interface EvaluateFormulaInput {
  expresion: string;
  variables: EvaluatorVariable[];
  constantes: EvaluatorConstante[];
  implicits: EvaluatorImplicits;
}

// Pure evaluator. No DB, no Prisma — caller resolves all values first.
// Throws EvaluatorError (422) on parse failure, unresolved identifier,
// unsupported origen, or non-finite numeric result.
//
// IVA semantics (two-pass evaluation):
//   `iva` resolves to "16% of the pre-tax subtotal", NOT the bare 0.16 rate.
//   This lets formulas written as `base + iva` produce `base * 1.16`
//   (the common case) without forcing the admin to spell out `* (1 + 0.16)`.
//
// To make `iva = subtotal * 0.16` self-consistent we run the parser twice:
//   1. Evaluate with iva = 0  →  yields the pre-tax subtotal.
//   2. Set iva = subtotal * 0.16, re-evaluate the same expression.
//
// Caveat: this assumes `iva` is used additively in the expression. Formulas
// that multiply by iva (legacy "base * iva" → tax amount) now return 0 in
// pass 1 and therefore 0 in pass 2. Migrate those to `base + iva` (the new
// semantics) or to an explicit `* 1.16` multiplier.
export function evaluateFormula(input: EvaluateFormulaInput): number {
  const parser = new Parser({
    operators: {
      // Disable statement-level features so the expression stays a pure value.
      assignment: false,
      fndef: false,
    },
  });

  // Parse once and reuse the AST for both passes — saves the second parse
  // and guarantees both runs see the exact same expression structure.
  let ast: ReturnType<typeof parser.parse>;
  try {
    ast = parser.parse(input.expresion);
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new EvaluatorError(`Error al evaluar fórmula: ${reason}`);
  }

  // Pass 1: subtotal with iva treated as 0.
  const subtotalScope = buildScope(input);
  subtotalScope.iva = 0;
  let subtotal: unknown;
  try {
    subtotal = ast.evaluate(subtotalScope);
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new EvaluatorError(`Error al evaluar fórmula: ${reason}`);
  }
  if (typeof subtotal !== "number" || !Number.isFinite(subtotal)) {
    throw new EvaluatorError("La fórmula no produjo un número finito");
  }

  // Pass 2: iva is 16% of the subtotal, re-evaluate the same AST.
  const finalScope = buildScope(input);
  finalScope.iva = subtotal * IVA_MX;
  let result: unknown;
  try {
    result = ast.evaluate(finalScope);
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new EvaluatorError(`Error al evaluar fórmula: ${reason}`);
  }

  if (typeof result !== "number" || !Number.isFinite(result)) {
    throw new EvaluatorError("La fórmula no produjo un número finito");
  }
  return result;
}

function buildScope(input: EvaluateFormulaInput): Record<string, number> {
  // Spread all implicits — covers the fixed trio (precio_material, costo_instalador,
  // costo_proveedor) plus any dynamic per-material tokens injected by the caller.
  const scope: Record<string, number> = {
    iva: IVA_MX,
    ...input.implicits,
  };

  for (const v of input.variables) {
    if ((RESERVED_IDENTIFIERS as readonly string[]).includes(v.nombre_variable)) {
      throw new EvaluatorError(`La variable "${v.nombre_variable}" usa un identificador reservado`);
    }
    if (!Number.isFinite(v.valor)) {
      throw new EvaluatorError(`La variable "${v.nombre_variable}" tiene un valor no finito`);
    }
    // Copilot review #5: defend against duplicate variable names colliding in scope.
    if (Object.prototype.hasOwnProperty.call(scope, v.nombre_variable)) {
      throw new EvaluatorError(
        `Identificador duplicado: "${v.nombre_variable}" ya está definido en el scope`
      );
    }
    scope[v.nombre_variable] = v.valor;
  }

  for (const c of input.constantes) {
    if ((RESERVED_IDENTIFIERS as readonly string[]).includes(c.nombre_constante)) {
      throw new EvaluatorError(
        `La constante "${c.nombre_constante}" usa un identificador reservado`
      );
    }
    //A constante must not shadow a variable (or another constante).
    if (Object.prototype.hasOwnProperty.call(scope, c.nombre_constante)) {
      throw new EvaluatorError(
        `Identificador duplicado: "${c.nombre_constante}" colisiona con una variable o constante previa`
      );
    }
    scope[c.nombre_constante] = resolveConstanteValor(c);
  }

  return scope;
}

function resolveConstanteValor(c: EvaluatorConstante): number {
  switch (c.origen) {
    case "manual":
      if (c.valor === null || c.valor === undefined) {
        throw new EvaluatorError(
          `Constante "${c.nombre_constante}" de origen "manual" no tiene valor`
        );
      }
      return c.valor;
    case "instalador":
      if (!c.instalador) {
        throw new EvaluatorError(`Constante "${c.nombre_constante}" no tiene instalador vinculado`);
      }
      return c.instalador.costo_instalacion;
    case "proveedor":
      if (!c.proveedor || c.proveedor.costo === null) {
        throw new EvaluatorError(
          `Constante "${c.nombre_constante}" no tiene costo de proveedor configurado`
        );
      }
      return c.proveedor.costo;
    case "maquina":
      // D6: el campo Maquinas.costo_por_minuto aún no existe.
      throw new EvaluatorError(
        `Constante "${c.nombre_constante}" con origen "maquina" no soportada todavía`
      );
    case "global":
      // D7: no hay tabla de constantes globales; usa el implícito "iva" o crea la constante como "manual".
      throw new EvaluatorError(
        `Constante "${c.nombre_constante}" con origen "global" no soportada — usa el implícito "iva" o crea como "manual"`
      );
    default:
      throw new EvaluatorError(
        `Constante "${c.nombre_constante}" con origen desconocido: "${c.origen}"`
      );
  }
}
