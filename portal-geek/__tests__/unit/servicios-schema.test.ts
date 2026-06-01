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
