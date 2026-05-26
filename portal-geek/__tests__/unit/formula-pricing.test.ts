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

    expect(result).toBe(175);
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

    expect(result).toBe(250);
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

    expect(result).toBe(300);
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

    expect(result).toBe(0);
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

  it("redondea el resultado a dos decimales", async () => {
    mockServiciosFindUnique.mockResolvedValue(makeServicio());
    mockInstaladorServiciosFindUnique.mockResolvedValue(null);
    mockEvaluateFormula.mockReturnValue(123.456789);

    const result = await calcularPrecioServicio(BASE_INPUT);

    expect(result).toBe(123.46);
  });
});
