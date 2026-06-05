/**
 * @jest-environment node
 */
import { prisma } from "@/lib/db/client";
import { calcularPrecioServicio } from "@/lib/services/formula-pricing";
import { NotFoundError, ValidationError } from "@/lib/utils/errors";
import { evaluateFormula } from "@/lib/utils/formula-evaluator";

// ─── Mocks ───────────────────────────────────────────────────────────────────

jest.mock("@/lib/db/client", () => ({
  prisma: {
    servicios: { findUnique: jest.fn() },
    instaladorServicios: { findUnique: jest.fn() },
  },
}));

jest.mock("@/lib/utils/formula-evaluator", () => ({
  evaluateFormula: jest.fn(),
}));

const mockServiciosFindUnique = prisma.servicios.findUnique as jest.Mock;
const mockInstaladorServiciosFindUnique = prisma.instaladorServicios.findUnique as jest.Mock;
const mockEvaluateFormula = evaluateFormula as jest.Mock;

// Profit margin applied to every quoted price (see formula-pricing.ts).
// Tests use this so the expected price reflects the markup automatically when
// MARGEN_GANANCIA is tuned in production code.
const MARGEN_GANANCIA = 0.3;
const withMargen = (costo: number) => Math.round((costo / (1 - MARGEN_GANANCIA)) * 100) / 100;

// ─── Fixtures ─────────────────────────────────────────────────────────────────

/** Minimal active formula with no variables or constantes. */
const BASE_FORMULA = {
  expresion: "precio_material + costo_instalador",
  variables: [],
  constantes: [],
};

/** Minimal linked material with a provider price. */
const BASE_MATERIAL = {
  proveedorPrecio: { precio: 50 },
};

/**
 * Returns a complete servicio fixture. Override individual fields as needed
 * to set up a specific scenario.
 */
function makeServicio(overrides: Record<string, unknown> = {}) {
  return {
    id_servicio: 1,
    id_instalador: 10,
    id_proveedor: null,
    costo_instalador_override: null,
    costo_proveedor_override: null,
    instalador: { costo_instalacion: 300 },
    proveedor: null,
    formulas: [BASE_FORMULA],
    servicioMateriales: [BASE_MATERIAL],
    ...overrides,
  };
}

const BASE_INPUT = { id_servicio: 1, id_material: 2, variables: [] };

// ─── Guard tests ──────────────────────────────────────────────────────────────

describe("calcularPrecioServicio — guards", () => {
  beforeEach(() => jest.clearAllMocks());

  it("lanza NotFoundError si el servicio no existe", async () => {
    mockServiciosFindUnique.mockResolvedValue(null);

    await expect(calcularPrecioServicio(BASE_INPUT)).rejects.toThrow(NotFoundError);
  });

  it("lanza ValidationError si no hay fórmula activa", async () => {
    mockServiciosFindUnique.mockResolvedValue(makeServicio({ formulas: [] }));
    mockInstaladorServiciosFindUnique.mockResolvedValue(null);

    await expect(calcularPrecioServicio(BASE_INPUT)).rejects.toThrow(ValidationError);
  });

  it("lanza ValidationError si el material no está vinculado al servicio", async () => {
    mockServiciosFindUnique.mockResolvedValue(makeServicio({ servicioMateriales: [] }));
    mockInstaladorServiciosFindUnique.mockResolvedValue(null);

    await expect(calcularPrecioServicio(BASE_INPUT)).rejects.toThrow(ValidationError);
  });

  it("lanza ValidationError si el cliente envía una variable no editable", async () => {
    const servicio = makeServicio({
      formulas: [
        {
          ...BASE_FORMULA,
          variables: [{ nombre_variable: "metros", valor_default: 1, editable_por_cliente: false }],
        },
      ],
    });
    mockServiciosFindUnique.mockResolvedValue(servicio);
    mockInstaladorServiciosFindUnique.mockResolvedValue(null);

    await expect(
      calcularPrecioServicio({
        ...BASE_INPUT,
        variables: [{ nombre_variable: "metros", valor: 5 }],
      })
    ).rejects.toThrow(ValidationError);
  });

  it("lanza ValidationError si una variable no tiene valor_default ni override del cliente", async () => {
    const servicio = makeServicio({
      formulas: [
        {
          ...BASE_FORMULA,
          variables: [
            { nombre_variable: "metros", valor_default: null, editable_por_cliente: true },
          ],
        },
      ],
    });
    mockServiciosFindUnique.mockResolvedValue(servicio);
    mockInstaladorServiciosFindUnique.mockResolvedValue(null);

    await expect(calcularPrecioServicio(BASE_INPUT)).rejects.toThrow(ValidationError);
  });
});

// ─── costo_instalador — tres niveles de fallback ───────────────────────────────

describe("calcularPrecioServicio — costo_instalador fallback", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Por defecto evaluateFormula devuelve el costo_instalador que recibe
    // para que podamos afirmar su valor exacto sin depender de la expresión.
    mockEvaluateFormula.mockImplementation(
      ({ implicits }: { implicits: { costo_instalador: number } }) => implicits.costo_instalador
    );
  });

  it("Nivel 1 — usa InstaladorServicios.costo cuando existe la fila (par instalador×servicio)", async () => {
    mockServiciosFindUnique.mockResolvedValue(
      makeServicio({ costo_instalador_override: 999, instalador: { costo_instalacion: 888 } })
    );
    mockInstaladorServiciosFindUnique.mockResolvedValue({ costo: 175 });

    const result = await calcularPrecioServicio(BASE_INPUT);

    expect(result).toBe(withMargen(175));
    expect(mockEvaluateFormula).toHaveBeenCalledWith(
      expect.objectContaining({
        implicits: expect.objectContaining({ costo_instalador: 175 }),
      })
    );
  });

  it("Nivel 1 — consulta InstaladorServicios con el par (id_instalador, id_servicio) correcto", async () => {
    const servicio = makeServicio({ id_instalador: 42, id_servicio: 7 });
    mockServiciosFindUnique.mockResolvedValue(servicio);
    mockInstaladorServiciosFindUnique.mockResolvedValue({ costo: 100 });
    mockEvaluateFormula.mockReturnValue(100);

    await calcularPrecioServicio({ ...BASE_INPUT, id_servicio: 7 });

    expect(mockInstaladorServiciosFindUnique).toHaveBeenCalledWith({
      where: {
        id_instalador_id_servicio: {
          id_instalador: 42,
          id_servicio: 7,
        },
      },
      select: { costo: true },
    });
  });

  it("Nivel 2 — usa costo_instalador_override cuando no hay fila en InstaladorServicios", async () => {
    mockServiciosFindUnique.mockResolvedValue(
      makeServicio({ costo_instalador_override: 250, instalador: { costo_instalacion: 888 } })
    );
    mockInstaladorServiciosFindUnique.mockResolvedValue(null); // sin fila

    const result = await calcularPrecioServicio(BASE_INPUT);

    expect(result).toBe(withMargen(250));
    expect(mockEvaluateFormula).toHaveBeenCalledWith(
      expect.objectContaining({
        implicits: expect.objectContaining({ costo_instalador: 250 }),
      })
    );
  });

  it("Nivel 3 — usa instalador.costo_instalacion cuando no hay fila ni override", async () => {
    mockServiciosFindUnique.mockResolvedValue(
      makeServicio({ costo_instalador_override: null, instalador: { costo_instalacion: 300 } })
    );
    mockInstaladorServiciosFindUnique.mockResolvedValue(null);

    const result = await calcularPrecioServicio(BASE_INPUT);

    expect(result).toBe(withMargen(300));
    expect(mockEvaluateFormula).toHaveBeenCalledWith(
      expect.objectContaining({
        implicits: expect.objectContaining({ costo_instalador: 300 }),
      })
    );
  });

  it("costo_instalador = 0 cuando el servicio no tiene instalador asignado", async () => {
    mockServiciosFindUnique.mockResolvedValue(
      makeServicio({ id_instalador: null, instalador: null, costo_instalador_override: null })
    );
    // No debe consultar InstaladorServicios si id_instalador es null
    mockInstaladorServiciosFindUnique.mockResolvedValue(null);

    const result = await calcularPrecioServicio(BASE_INPUT);

    expect(result).toBe(withMargen(0));
    expect(mockInstaladorServiciosFindUnique).not.toHaveBeenCalled();
    expect(mockEvaluateFormula).toHaveBeenCalledWith(
      expect.objectContaining({
        implicits: expect.objectContaining({ costo_instalador: 0 }),
      })
    );
  });
});

// ─── Resultado final ──────────────────────────────────────────────────────────

describe("calcularPrecioServicio — resultado", () => {
  beforeEach(() => jest.clearAllMocks());

  it("pasa precio_material desde proveedorPrecio al evaluador", async () => {
    mockServiciosFindUnique.mockResolvedValue(
      makeServicio({ servicioMateriales: [{ proveedorPrecio: { precio: 120 } }] })
    );
    mockInstaladorServiciosFindUnique.mockResolvedValue(null);
    mockEvaluateFormula.mockReturnValue(0);

    await calcularPrecioServicio(BASE_INPUT);

    expect(mockEvaluateFormula).toHaveBeenCalledWith(
      expect.objectContaining({
        implicits: expect.objectContaining({ precio_material: 120 }),
      })
    );
  });

  it("precio_material = 0 cuando el material no tiene proveedorPrecio vinculado", async () => {
    mockServiciosFindUnique.mockResolvedValue(
      makeServicio({ servicioMateriales: [{ proveedorPrecio: null }] })
    );
    mockInstaladorServiciosFindUnique.mockResolvedValue(null);
    mockEvaluateFormula.mockReturnValue(0);

    await calcularPrecioServicio(BASE_INPUT);

    expect(mockEvaluateFormula).toHaveBeenCalledWith(
      expect.objectContaining({
        implicits: expect.objectContaining({ precio_material: 0 }),
      })
    );
  });

  it("redondea el resultado a dos decimales (después de aplicar el margen)", async () => {
    mockServiciosFindUnique.mockResolvedValue(makeServicio());
    mockInstaladorServiciosFindUnique.mockResolvedValue(null);
    mockEvaluateFormula.mockReturnValue(123.456789);

    const result = await calcularPrecioServicio(BASE_INPUT);

    // 123.456789 / 0.7 = 176.3668414... → 176.37
    expect(result).toBe(withMargen(123.456789));
  });

  it("aplica el margen de ganancia 30% al resultado del evaluador", async () => {
    // Sanity check that markup is wired: costo $700 → precio $1000 (margen
    // bruto $300, que es el 30% del precio de venta).
    mockServiciosFindUnique.mockResolvedValue(makeServicio());
    mockInstaladorServiciosFindUnique.mockResolvedValue(null);
    mockEvaluateFormula.mockReturnValue(700);

    const result = await calcularPrecioServicio(BASE_INPUT);

    expect(result).toBe(1000);
  });
});

// ─── Polymorphic material tokens ──────────────────────────────────────────────
//
// Tests cover the reviewer-requested behavior: precio_material and
// velocidad_avance both adopt the value of the customer-selected material,
// legacy costo_material_<slug> tokens keep resolving for back-compat, and the
// missing-data fallbacks (0) match the documented BYO semantics in
// formula-pricing.ts (a missing field is NOT a quotation failure — the admin
// is expected to structure formulas that handle a 0 contribution gracefully).

describe("calcularPrecioServicio — polymorphic material tokens", () => {
  beforeEach(() => jest.clearAllMocks());

  it("pasa velocidad_avance desde el material elegido al evaluador", async () => {
    mockServiciosFindUnique.mockResolvedValue(
      makeServicio({
        servicioMateriales: [
          {
            proveedorPrecio: { precio: 50 },
            material: { nombre_material: "MDF 3mm", velocidad_avance: 15 },
          },
        ],
      })
    );
    mockInstaladorServiciosFindUnique.mockResolvedValue(null);
    mockEvaluateFormula.mockReturnValue(0);

    await calcularPrecioServicio(BASE_INPUT);

    expect(mockEvaluateFormula).toHaveBeenCalledWith(
      expect.objectContaining({
        implicits: expect.objectContaining({ velocidad_avance: 15 }),
      })
    );
  });

  it("velocidad_avance = 0 cuando el material no tiene el campo (BYO fallback)", async () => {
    mockServiciosFindUnique.mockResolvedValue(
      makeServicio({
        servicioMateriales: [
          {
            proveedorPrecio: { precio: 50 },
            material: { nombre_material: "Tela algodón", velocidad_avance: null },
          },
        ],
      })
    );
    mockInstaladorServiciosFindUnique.mockResolvedValue(null);
    mockEvaluateFormula.mockReturnValue(0);

    await calcularPrecioServicio(BASE_INPUT);

    expect(mockEvaluateFormula).toHaveBeenCalledWith(
      expect.objectContaining({
        implicits: expect.objectContaining({ velocidad_avance: 0 }),
      })
    );
  });

  it("inyecta legacy costo_material_<slug> con el precio del material elegido", async () => {
    // Servicios saved before the polymorphic refactor still reference per-material
    // slug tokens in their saved expresion. The pricing layer keeps injecting
    // them so those formulas don't break — slug is derived from nombre_material.
    mockServiciosFindUnique.mockResolvedValue(
      makeServicio({
        servicioMateriales: [
          {
            proveedorPrecio: { precio: 200 },
            material: { nombre_material: "MDF 3mm", velocidad_avance: null },
          },
        ],
      })
    );
    mockInstaladorServiciosFindUnique.mockResolvedValue(null);
    mockEvaluateFormula.mockReturnValue(0);

    await calcularPrecioServicio(BASE_INPUT);

    expect(mockEvaluateFormula).toHaveBeenCalledWith(
      expect.objectContaining({
        implicits: expect.objectContaining({ costo_material_mdf_3mm: 200 }),
      })
    );
  });

  it("legacy slug cae al fallback `material_<id>` si el material no expone nombre", async () => {
    // Defensive branch: when the prisma include of `material` is missing
    // (older callers / tests), the slug is built from the id so the implicit
    // key remains deterministic instead of crashing.
    mockServiciosFindUnique.mockResolvedValue(
      makeServicio({
        servicioMateriales: [{ proveedorPrecio: { precio: 75 } }],
      })
    );
    mockInstaladorServiciosFindUnique.mockResolvedValue(null);
    mockEvaluateFormula.mockReturnValue(0);

    await calcularPrecioServicio({ ...BASE_INPUT, id_material: 42 });

    expect(mockEvaluateFormula).toHaveBeenCalledWith(
      expect.objectContaining({
        implicits: expect.objectContaining({ costo_material_material_42: 75 }),
      })
    );
  });
});
