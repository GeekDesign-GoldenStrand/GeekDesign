/**
 * @jest-environment node
 */
import { prisma } from "@/lib/db/client";
import { aplicarDescuento } from "@/lib/services/cotizaciones";
import { NotFoundError, ConflictError, ValidationError } from "@/lib/utils/errors";

// ── DB mock ───────────────────────────────────────────────────────────────────
jest.mock("@/lib/db/client", () => ({
  prisma: {
    $transaction: jest.fn(),
    cotizaciones: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    detallePedido: {
      update: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

const mockFindUnique = prisma.cotizaciones.findUnique as jest.Mock;
const mockUpdate = prisma.cotizaciones.update as jest.Mock;

// ── Fixtures ──────────────────────────────────────────────────────────────────
const COTIZACION_PENDIENTE = {
  id_cotizacion: 1,
  id_pedido: 10,
  monto_total: "1000.00",
  porcentaje_descuento: null,
  motivo_descuento: null,
  id_estatus_cotizacion: 1,
  estatus: { descripcion: "Pendiente" },
  pedido: {
    detalles: [{ subtotal: "600.00" }, { subtotal: "400.00" }],
  },
};

const COTIZACION_VALIDADA = {
  ...COTIZACION_PENDIENTE,
  estatus: { descripcion: "Validada" },
};

const COTIZACION_APROBADA = {
  ...COTIZACION_PENDIENTE,
  estatus: { descripcion: "Aprobada" },
};

// ─────────────────────────────────────────────────────────────────────────────
// aplicarDescuento — COT-06
// ─────────────────────────────────────────────────────────────────────────────
describe("aplicarDescuento", () => {
  beforeEach(() => jest.clearAllMocks());

  // ── Not found ─────────────────────────────────────────────────────────────
  it("lanza NotFoundError cuando la cotización no existe", async () => {
    mockFindUnique.mockResolvedValue(null);

    await expect(aplicarDescuento(999, 10)).rejects.toThrow(NotFoundError);
  });

  // ── Estatus validation ────────────────────────────────────────────────────
  // Policy: aplicarDescuento only accepts Pendiente (mirrors updateCotizacion).
  // Anything else returns ConflictError so the storefront never silently
  // mutates a quote the cliente has already moved past.
  it("lanza ConflictError cuando el estatus es Validada", async () => {
    mockFindUnique.mockResolvedValue(COTIZACION_VALIDADA);

    await expect(aplicarDescuento(1, 10)).rejects.toThrow(ConflictError);
  });

  it("lanza ConflictError cuando el estatus es Aprobada", async () => {
    mockFindUnique.mockResolvedValue(COTIZACION_APROBADA);

    await expect(aplicarDescuento(1, 10)).rejects.toThrow(ConflictError);
  });

  it("lanza ConflictError cuando el estatus es Cancelada", async () => {
    mockFindUnique.mockResolvedValue({
      ...COTIZACION_PENDIENTE,
      estatus: { descripcion: "Cancelada" },
    });

    await expect(aplicarDescuento(1, 10)).rejects.toThrow(ConflictError);
  });

  it("lanza ConflictError cuando el estatus es Rechazada", async () => {
    mockFindUnique.mockResolvedValue({
      ...COTIZACION_PENDIENTE,
      estatus: { descripcion: "Rechazada" },
    });

    await expect(aplicarDescuento(1, 10)).rejects.toThrow(ConflictError);
  });

  // ── Allowed statuses ──────────────────────────────────────────────────────
  it("permite aplicar descuento en estatus Pendiente", async () => {
    mockFindUnique.mockResolvedValue(COTIZACION_PENDIENTE);
    mockUpdate.mockResolvedValue({ ...COTIZACION_PENDIENTE, porcentaje_descuento: "10.00" });

    await expect(aplicarDescuento(1, 10)).resolves.not.toThrow();
  });

  // ── Monto calculation ─────────────────────────────────────────────────────
  it("recalcula monto_total correctamente con detalles", async () => {
    // detalles: 600 + 400 = 1000 base, 10% descuento → 900
    mockFindUnique.mockResolvedValue(COTIZACION_PENDIENTE);
    mockUpdate.mockResolvedValue({});

    await aplicarDescuento(1, 10);

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          monto_total: 900,
        }),
      })
    );
  });

  it("recalcula monto_total correctamente al aplicar un interés (porcentaje negativo)", async () => {
    // detalles: 600 + 400 = 1000 base, -15% interés → 1150
    mockFindUnique.mockResolvedValue(COTIZACION_PENDIENTE);
    mockUpdate.mockResolvedValue({});

    await aplicarDescuento(1, -15);

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          monto_total: 1150,
        }),
      })
    );
  });

  it("usa monto_total almacenado cuando no hay detalles", async () => {
    // Sin detalles → fallback a monto_total = 1000, 20% → 800
    mockFindUnique.mockResolvedValue({
      ...COTIZACION_PENDIENTE,
      pedido: { detalles: [] },
    });
    mockUpdate.mockResolvedValue({});

    await aplicarDescuento(1, 20);

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          monto_total: 800,
        }),
      })
    );
  });

  it("usa monto_total almacenado cuando no hay pedido", async () => {
    mockFindUnique.mockResolvedValue({
      ...COTIZACION_PENDIENTE,
      pedido: null,
    });
    mockUpdate.mockResolvedValue({});

    await aplicarDescuento(1, 10);

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          monto_total: 900,
        }),
      })
    );
  });

  // ── Overflow guard ────────────────────────────────────────────────────────
  it("lanza ValidationError si el monto total supera MONTO_TOTAL_MAX al aplicar interés", async () => {
    // 99,000,000 + 20% interés = 118,800,000 (Excede 99,999,999.99)
    mockFindUnique.mockResolvedValue({
      ...COTIZACION_PENDIENTE,
      pedido: { detalles: [{ subtotal: "99000000.00" }] },
    });

    await expect(aplicarDescuento(1, -20)).rejects.toThrow(ValidationError);
  });

  it("redondea monto_total a 2 decimales", async () => {
    // 1000 * (1 - 15/100) = 850.00 — exact, but test with an amount that produces decimals
    mockFindUnique.mockResolvedValue({
      ...COTIZACION_PENDIENTE,
      pedido: { detalles: [{ subtotal: "333.33" }] },
    });
    mockUpdate.mockResolvedValue({});

    await aplicarDescuento(1, 10);

    const calledWith = mockUpdate.mock.calls[0][0];
    const montoTotal = calledWith.data.monto_total;
    expect(Number.isFinite(montoTotal)).toBe(true);
    expect(String(montoTotal).split(".")[1]?.length ?? 0).toBeLessThanOrEqual(2);
  });

  // ── Motivo handling ───────────────────────────────────────────────────────
  it("guarda motivo cuando se proporciona", async () => {
    mockFindUnique.mockResolvedValue(COTIZACION_PENDIENTE);
    mockUpdate.mockResolvedValue({});

    await aplicarDescuento(1, 10, "Cliente frecuente");

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          motivo_descuento: "Cliente frecuente",
        }),
      })
    );
  });

  it("guarda motivo como null cuando no se proporciona", async () => {
    mockFindUnique.mockResolvedValue(COTIZACION_PENDIENTE);
    mockUpdate.mockResolvedValue({});

    await aplicarDescuento(1, 10);

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          motivo_descuento: null,
        }),
      })
    );
  });

  it("normaliza motivo con solo espacios a null", async () => {
    mockFindUnique.mockResolvedValue(COTIZACION_PENDIENTE);
    mockUpdate.mockResolvedValue({});

    await aplicarDescuento(1, 10, "   ");

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          motivo_descuento: null,
        }),
      })
    );
  });

  it("hace trim al motivo antes de guardarlo", async () => {
    mockFindUnique.mockResolvedValue(COTIZACION_PENDIENTE);
    mockUpdate.mockResolvedValue({});

    await aplicarDescuento(1, 10, "  Cliente frecuente  ");

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          motivo_descuento: "Cliente frecuente",
        }),
      })
    );
  });

  // ── Update payload ────────────────────────────────────────────────────────
  it("llama a update con el id correcto", async () => {
    mockFindUnique.mockResolvedValue(COTIZACION_PENDIENTE);
    mockUpdate.mockResolvedValue({});

    await aplicarDescuento(1, 10);

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id_cotizacion: 1 },
      })
    );
  });

  it("incluye porcentaje_descuento en el update", async () => {
    mockFindUnique.mockResolvedValue(COTIZACION_PENDIENTE);
    mockUpdate.mockResolvedValue({});

    await aplicarDescuento(1, 15);

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          porcentaje_descuento: 15,
        }),
      })
    );
  });

  it("retorna el resultado del update", async () => {
    const updatedCotizacion = { ...COTIZACION_PENDIENTE, porcentaje_descuento: "10.00" };
    mockFindUnique.mockResolvedValue(COTIZACION_PENDIENTE);
    mockUpdate.mockResolvedValue(updatedCotizacion);

    const result = await aplicarDescuento(1, 10);

    expect(result).toEqual(updatedCotizacion);
  });
});
