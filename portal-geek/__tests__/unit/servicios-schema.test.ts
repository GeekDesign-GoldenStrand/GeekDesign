/**
 * @jest-environment node
 */
import { CreateServicioSchema } from "@/lib/schemas/servicios";

// Minimum payload that satisfies CreateServicioSchema's required fields.
// Each test overrides only the variable under inspection.
function makePayload(unidad: string) {
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
          editable_por_cliente: true,
          unidad,
        },
      ],
      constantes: [],
    },
  };
}

// Regression coverage for the formula-save bug: the API schema bounds the
// unidad length so a P2000 from Prisma (column overflow) can't happen even if
// the UI dropdown is bypassed. Short symbols (the UNIT_OPTIONS values) must
// continue to pass.
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
