/**
 * @jest-environment node
 */
import { CreateServicioSchema } from "@/lib/schemas/servicios";

// Minimum payload that satisfies CreateServicioSchema's required fields.
// Each test overrides only the variable under inspection.
function makePayload(unidad = "cm", overrides: Record<string, unknown> = {}) {
  return {
    id_sucursal: 1,
    nombre_servicio: "Servicio Test",
    apodo_servicio: "Corte CO2",
    formula: {
      expresion: "ancho * 2",
      variables: [
        {
          id_tipo_variable: 1,
          nombre_variable: "ancho",
          etiqueta: "Ancho",
          editable_por_cliente: true,
          unidad,
        },
      ],
      constantes: [],
    },
    ...overrides,
  };
}

function makeVariablePayload(valor_default: unknown) {
  return {
    id_sucursal: 1,
    nombre_servicio: "Servicio Test",
    formula: {
      expresion: "ancho * 2",
      variables: [
        {
          id_tipo_variable: 1,
          nombre_variable: "ancho",
          etiqueta: "Ancho",
          editable_por_cliente: false,
          valor_default,
        },
      ],
      constantes: [],
    },
  };
}

function makeConstantePayload(valor: unknown) {
  return {
    id_sucursal: 1,
    nombre_servicio: "Servicio Test",
    formula: {
      expresion: "k * 2",
      variables: [],
      constantes: [
        {
          nombre_constante: "k",
          origen: "manual",
          valor,
        },
      ],
    },
  };
}

// Regression coverage for the formula-save bug: the API schema bounds the
// unidad length so a P2000 from Prisma (column overflow) can't happen even if
// the UI dropdown is bypassed. Short symbols (the UNIT_OPTIONS values) must
// continue to pass.
describe("CreateServicioSchema — apodo_servicio", () => {
  it("rechaza servicio sin apodo_servicio", () => {
    const payload = makePayload();
    delete (payload as Partial<typeof payload>).apodo_servicio;

    const result = CreateServicioSchema.safeParse(payload);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === "apodo_servicio")).toBe(true);
    }
  });

  it("rechaza apodo_servicio mayor a 100 caracteres", () => {
    const result = CreateServicioSchema.safeParse(
      makePayload("cm", {
        apodo_servicio: "A".repeat(101),
      })
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === "apodo_servicio")).toBe(true);
    }
  });

  it("acepta apodo_servicio de exactamente 100 caracteres", () => {
    const result = CreateServicioSchema.safeParse(
      makePayload("cm", {
        apodo_servicio: "A".repeat(100),
      })
    );

    expect(result.success).toBe(true);
  });
});

describe("CreateServicioSchema — variable unidad length", () => {
  it.each(["cm", "cm²", "m²", "$", "min", "h", "%", "pz", "u"])(
    "accepts short symbol unit: %s",
    (unidad) => {
      const result = CreateServicioSchema.safeParse(makePayload(unidad));
      expect(result.success).toBe(true);
    }
  );

  it("rejects unidad longer than 20 characters", () => {
    const result = CreateServicioSchema.safeParse(
      makePayload("a".repeat(21)) // 21 chars, just over the .max(20) cap (aligned with FormulaVariables.unidad VarChar(20))
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[i.path.length - 1] === "unidad");
      expect(issue).toBeDefined();
    }
  });

  it("accepts unidad of exactly 20 characters (boundary)", () => {
    const result = CreateServicioSchema.safeParse(makePayload("a".repeat(20)));
    expect(result.success).toBe(true);
  });
});

// Regression for P2020 production 500: valor_default maps to Decimal(10,4),
// which caps the integer part at 6 digits (max 999,999.9999). Zod must reject
// values ≥ 1,000,000 before they reach the DB.
describe("CreateServicioSchema — variable valor_default bounds (Decimal 10,4)", () => {
  it.each([0, 1, 999999.99, 500.5])("accepts valid valor_default: %s", (v) => {
    const result = CreateServicioSchema.safeParse(makeVariablePayload(v));
    expect(result.success).toBe(true);
  });

  it("accepts valor_default omitted (optional)", () => {
    const result = CreateServicioSchema.safeParse(makeVariablePayload(undefined));
    expect(result.success).toBe(true);
  });

  it("rejects valor_default = 1000000 (overflows Decimal(10,4))", () => {
    const result = CreateServicioSchema.safeParse(makeVariablePayload(1000000));
    expect(result.success).toBe(false);
  });

  it("rejects valor_default = 999999.999 (3 decimals exceed Decimal(10,4) limit of 2)", () => {
    const result = CreateServicioSchema.safeParse(makeVariablePayload(999999.999));
    expect(result.success).toBe(false);
  });

  it("rejects negative valor_default", () => {
    const result = CreateServicioSchema.safeParse(makeVariablePayload(-1));
    expect(result.success).toBe(false);
  });

  it("coerces string '100' to number (z.coerce)", () => {
    const result = CreateServicioSchema.safeParse(makeVariablePayload("100"));
    expect(result.success).toBe(true);
  });
});

// Regression for the same P2020 on constante.valor: Decimal(10,2) allows up
// to 99,999,999.99. Values with >2 decimals must also be rejected.
describe("CreateServicioSchema — constante valor bounds (Decimal 10,2)", () => {
  it.each([0, 1, 99999999.99, 1500.5])("accepts valid constante valor: %s", (v) => {
    const result = CreateServicioSchema.safeParse(makeConstantePayload(v));
    expect(result.success).toBe(true);
  });

  it("accepts constante valor omitted (optional for non-manual)", () => {
    const result = CreateServicioSchema.safeParse({
      id_sucursal: 1,
      nombre_servicio: "Test",
      formula: {
        expresion: "k",
        variables: [],
        constantes: [{ nombre_constante: "k", origen: "instalador", id_instalador: 1 }],
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejects constante valor = 1.999 (3 decimals exceed Decimal(10,2) limit)", () => {
    const result = CreateServicioSchema.safeParse(makeConstantePayload(1.999));
    expect(result.success).toBe(false);
  });

  it("rejects negative constante valor", () => {
    const result = CreateServicioSchema.safeParse(makeConstantePayload(-0.01));
    expect(result.success).toBe(false);
  });
});
