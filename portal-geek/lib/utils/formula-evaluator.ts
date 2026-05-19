import { Parser } from "expr-eval";

import { EvaluatorError } from "@/lib/utils/errors";

// Identifiers that the evaluator always injects into scope.
// Variables and constantes cannot reuse these names — see buildScope guard.
export const RESERVED_IDENTIFIERS = [
  "precio_material",
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
  precio_material: number;
  costo_instalador: number;
  costo_proveedor: number;
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
export function evaluateFormula(input: EvaluateFormulaInput): number {
  const scope = buildScope(input);
  const parser = new Parser({
    operators: {
      // Disable statement-level features so the expression stays a pure value.
      assignment: false,
      fndef: false,
    },
  });

  let result: unknown;
  try {
    result = parser.parse(input.expresion).evaluate(scope);
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
  const scope: Record<string, number> = {
    iva: IVA_MX,
    precio_material: input.implicits.precio_material,
    costo_instalador: input.implicits.costo_instalador,
    costo_proveedor: input.implicits.costo_proveedor,
  };

  for (const v of input.variables) {
    if ((RESERVED_IDENTIFIERS as readonly string[]).includes(v.nombre_variable)) {
      throw new EvaluatorError(`La variable "${v.nombre_variable}" usa un identificador reservado`);
    }
    if (!Number.isFinite(v.valor)) {
      throw new EvaluatorError(`La variable "${v.nombre_variable}" tiene un valor no finito`);
    }
    scope[v.nombre_variable] = v.valor;
  }

  for (const c of input.constantes) {
    if ((RESERVED_IDENTIFIERS as readonly string[]).includes(c.nombre_constante)) {
      throw new EvaluatorError(
        `La constante "${c.nombre_constante}" usa un identificador reservado`
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
