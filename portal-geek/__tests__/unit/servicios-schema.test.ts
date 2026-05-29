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

// Regression coverage for the formula-save bug: FormulaVariables.unidad is
// VarChar(20) on the DB side, so the API schema must reject anything longer
// to avoid a P2000 from Prisma. Short symbols (the new UNIT_OPTIONS values)
// must continue to pass.
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
      makePayload("cm² - centímetros cuadrados") // 27 chars, breaks VarChar(20)
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[i.path.length - 1] === "unidad");
      expect(issue).toBeDefined();
    }
  });
});
