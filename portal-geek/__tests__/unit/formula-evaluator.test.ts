/**
 * @jest-environment node
 */
import { EvaluatorError } from "@/lib/utils/errors";
import {
  evaluateFormula,
  IVA_MX,
  RESERVED_IDENTIFIERS,
  type EvaluatorConstante,
  type EvaluatorImplicits,
  type EvaluatorVariable,
} from "@/lib/utils/formula-evaluator";

const ZERO_IMPLICITS: EvaluatorImplicits = {
  precio_material: 0,
  costo_instalador: 0,
  costo_proveedor: 0,
};

function manual(nombre: string, valor: number): EvaluatorConstante {
  return { nombre_constante: nombre, origen: "manual", valor, instalador: null, proveedor: null };
}

function variable(nombre: string, valor: number): EvaluatorVariable {
  return { nombre_variable: nombre, valor };
}

describe("evaluateFormula — happy path", () => {
  it("evalúa una expresión aritmética simple con una variable", () => {
    const result = evaluateFormula({
      expresion: "ancho * 2",
      variables: [variable("ancho", 50)],
      constantes: [],
      implicits: ZERO_IMPLICITS,
    });
    expect(result).toBe(100);
  });

  it("combina variables, constantes manuales e implícitos", () => {
    const result = evaluateFormula({
      expresion: "ancho * alto * costo_laser + precio_material",
      variables: [variable("ancho", 10), variable("alto", 5)],
      constantes: [manual("costo_laser", 2.5)],
      implicits: { precio_material: 100, costo_instalador: 0, costo_proveedor: 0 },
    });
    // 10 * 5 * 2.5 + 100 = 225
    expect(result).toBe(225);
  });

  it("inyecta iva = 0.16 automáticamente", () => {
    const result = evaluateFormula({
      expresion: "100 * (1 + iva)",
      variables: [],
      constantes: [],
      implicits: ZERO_IMPLICITS,
    });
    expect(result).toBeCloseTo(116);
    expect(IVA_MX).toBe(0.16);
  });

  it("expone costo_instalador y costo_proveedor desde implícitos", () => {
    const result = evaluateFormula({
      expresion: "costo_instalador + costo_proveedor",
      variables: [],
      constantes: [],
      implicits: { precio_material: 0, costo_instalador: 50, costo_proveedor: 30 },
    });
    expect(result).toBe(80);
  });

  it("resuelve constantes con origen instalador/proveedor desde la entidad vinculada", () => {
    const constantes: EvaluatorConstante[] = [
      {
        nombre_constante: "mano_obra",
        origen: "instalador",
        valor: null,
        instalador: { costo_instalacion: 80 },
        proveedor: null,
      },
      {
        nombre_constante: "costo_acrilico",
        origen: "proveedor",
        valor: null,
        instalador: null,
        proveedor: { costo: 120 },
      },
    ];
    const result = evaluateFormula({
      expresion: "mano_obra + costo_acrilico",
      variables: [],
      constantes,
      implicits: ZERO_IMPLICITS,
    });
    expect(result).toBe(200);
  });

  it("permite funciones matemáticas seguras de expr-eval", () => {
    const result = evaluateFormula({
      expresion: "max(ancho, alto) * 2",
      variables: [variable("ancho", 7), variable("alto", 10)],
      constantes: [],
      implicits: ZERO_IMPLICITS,
    });
    expect(result).toBe(20);
  });
});

describe("evaluateFormula — errores", () => {
  it("lanza EvaluatorError si la expresión es inválida", () => {
    expect(() =>
      evaluateFormula({
        expresion: "ancho *",
        variables: [variable("ancho", 50)],
        constantes: [],
        implicits: ZERO_IMPLICITS,
      })
    ).toThrow(EvaluatorError);
  });

  it("lanza EvaluatorError si la expresión referencia un identificador no resuelto", () => {
    expect(() =>
      evaluateFormula({
        expresion: "ancho * desconocido",
        variables: [variable("ancho", 50)],
        constantes: [],
        implicits: ZERO_IMPLICITS,
      })
    ).toThrow(EvaluatorError);
  });

  it("lanza EvaluatorError si el resultado no es finito", () => {
    expect(() =>
      evaluateFormula({
        expresion: "1 / 0",
        variables: [],
        constantes: [],
        implicits: ZERO_IMPLICITS,
      })
    ).toThrow(/finito/);
  });

  it.each(RESERVED_IDENTIFIERS)(
    "rechaza variables que sobreescriben el identificador reservado %s",
    (reserved) => {
      expect(() =>
        evaluateFormula({
          expresion: "1 + 1",
          variables: [variable(reserved, 99)],
          constantes: [],
          implicits: ZERO_IMPLICITS,
        })
      ).toThrow(/identificador reservado/);
    }
  );

  it.each(RESERVED_IDENTIFIERS)(
    "rechaza constantes que sobreescriben el identificador reservado %s",
    (reserved) => {
      expect(() =>
        evaluateFormula({
          expresion: "1 + 1",
          variables: [],
          constantes: [manual(reserved, 99)],
          implicits: ZERO_IMPLICITS,
        })
      ).toThrow(/identificador reservado/);
    }
  );

  it("lanza EvaluatorError si constante manual no tiene valor (D6 defensa)", () => {
    expect(() =>
      evaluateFormula({
        expresion: "1 + sin_valor",
        variables: [],
        constantes: [
          {
            nombre_constante: "sin_valor",
            origen: "manual",
            valor: null,
            instalador: null,
            proveedor: null,
          },
        ],
        implicits: ZERO_IMPLICITS,
      })
    ).toThrow(/no tiene valor/);
  });

  it("D6: lanza EvaluatorError si una constante usa origen 'maquina'", () => {
    expect(() =>
      evaluateFormula({
        expresion: "1 + tiempo_maquina",
        variables: [],
        constantes: [
          {
            nombre_constante: "tiempo_maquina",
            origen: "maquina",
            valor: null,
            instalador: null,
            proveedor: null,
          },
        ],
        implicits: ZERO_IMPLICITS,
      })
    ).toThrow(/no soportada todavía/);
  });

  it("D7: lanza EvaluatorError si una constante usa origen 'global'", () => {
    expect(() =>
      evaluateFormula({
        expresion: "1 + impuesto",
        variables: [],
        constantes: [
          {
            nombre_constante: "impuesto",
            origen: "global",
            valor: null,
            instalador: null,
            proveedor: null,
          },
        ],
        implicits: ZERO_IMPLICITS,
      })
    ).toThrow(/no soportada — usa el implícito "iva"/);
  });

  it("rechaza variables con valor no finito", () => {
    expect(() =>
      evaluateFormula({
        expresion: "ancho * 2",
        variables: [variable("ancho", Number.POSITIVE_INFINITY)],
        constantes: [],
        implicits: ZERO_IMPLICITS,
      })
    ).toThrow(/no finito/);
  });

  it("Copilot #5: rechaza dos variables con el mismo nombre", () => {
    expect(() =>
      evaluateFormula({
        expresion: "x + 1",
        variables: [variable("x", 5), variable("x", 7)],
        constantes: [],
        implicits: ZERO_IMPLICITS,
      })
    ).toThrow(/duplicado/);
  });

  it("Copilot #5: rechaza constante que colisiona con una variable", () => {
    expect(() =>
      evaluateFormula({
        expresion: "x + 1",
        variables: [variable("x", 5)],
        constantes: [manual("x", 10)],
        implicits: ZERO_IMPLICITS,
      })
    ).toThrow(/duplicado|colisiona/);
  });

  it("Copilot #5: rechaza dos constantes con el mismo nombre", () => {
    expect(() =>
      evaluateFormula({
        expresion: "k + 1",
        variables: [],
        constantes: [manual("k", 10), manual("k", 20)],
        implicits: ZERO_IMPLICITS,
      })
    ).toThrow(/duplicado|colisiona/);
  });

  it("bloquea sintaxis de asignación (parser configurado sin operadores de statement)", () => {
    expect(() =>
      evaluateFormula({
        expresion: "ancho = 5; ancho * 2",
        variables: [variable("ancho", 1)],
        constantes: [],
        implicits: ZERO_IMPLICITS,
      })
    ).toThrow(EvaluatorError);
  });
});
