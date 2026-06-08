/**
 * @jest-environment node
 */
import { prisma } from "@/lib/db/client";
import { getPedidoFacturacion, getPedidosParaFacturar } from "@/lib/services/finanzas";

jest.mock("@/lib/db/client", () => ({
  prisma: {
    pedidos: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

const mockFindMany = prisma.pedidos.findMany as jest.Mock;
const mockFindUnique = prisma.pedidos.findUnique as jest.Mock;

// ── Fixtures ──────────────────────────────────────────────────────────────────

const DATOS_FACTURACION = {
  rfc: "LOPA800101ABC",
  razon_social: "Ana López",
  tipo_persona: "Fisica",
  regimen_fiscal: "601",
  uso_cfdi: "G03",
  codigo_postal_fiscal: "64000",
  correo_facturacion: "ana@geek.mx",
};

const BASE_PEDIDO = {
  id_pedido: 1,
  fecha_creacion: new Date("2024-06-01"),
  facturado: false,
  numero_factura: null as string | null,
  estado_factura: { descripcion: "Cotizacion" },
  cliente: { nombre_cliente: "Ana López", empresa: "GeekDesign SA" },
  cotizaciones: [{ folio: "COT-001", estatus: { descripcion: "Validada" } }],
  datos_facturacion: DATOS_FACTURACION,
};

const pedido = (overrides: Partial<typeof BASE_PEDIDO> = {}) => ({
  ...BASE_PEDIDO,
  ...overrides,
});

// ─────────────────────────────────────────────────────────────────────────────
// getPedidosParaFacturar
// ─────────────────────────────────────────────────────────────────────────────
describe("getPedidosParaFacturar", () => {
  beforeEach(() => jest.clearAllMocks());

  // ── Where clause ────────────────────────────────────────────────────────────

  it("filters by factura=true and cotización Validada", async () => {
    mockFindMany.mockResolvedValue([]);

    await getPedidosParaFacturar();

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          factura: true,
          cotizaciones: { some: { estatus: { descripcion: "Validada" } } },
        },
      })
    );
  });

  it("does NOT filter by facturado — already-invoiced orders must still appear", async () => {
    const invoiced = pedido({ facturado: true, numero_factura: "FAC-001" });
    mockFindMany.mockResolvedValue([invoiced]);

    const result = await getPedidosParaFacturar();

    expect(result[0].facturado).toBe(true);
    const where = (mockFindMany.mock.calls[0][0] as { where: Record<string, unknown> }).where;
    expect(where).not.toHaveProperty("facturado");
  });

  // ── Ordering ────────────────────────────────────────────────────────────────

  it("orders results by fecha_creacion descending", async () => {
    mockFindMany.mockResolvedValue([]);

    await getPedidosParaFacturar();

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { fecha_creacion: "desc" } })
    );
  });

  it("returns multiple pedidos in the order Prisma provides", async () => {
    const p1 = pedido({ id_pedido: 10, fecha_creacion: new Date("2024-06-10") });
    const p2 = pedido({ id_pedido: 5, fecha_creacion: new Date("2024-06-01") });
    mockFindMany.mockResolvedValue([p1, p2]);

    const result = await getPedidosParaFacturar();

    expect(result).toHaveLength(2);
    expect(result[0].id_pedido).toBe(10);
    expect(result[1].id_pedido).toBe(5);
  });

  // ── Select shape ─────────────────────────────────────────────────────────────

  it("selects all required top-level fields", async () => {
    mockFindMany.mockResolvedValue([]);

    await getPedidosParaFacturar();

    const { select } = mockFindMany.mock.calls[0][0] as { select: Record<string, unknown> };
    expect(select).toMatchObject({
      id_pedido: true,
      fecha_creacion: true,
      facturado: true,
      numero_factura: true,
    });
  });

  it("selects estado_factura.descripcion", async () => {
    mockFindMany.mockResolvedValue([]);

    await getPedidosParaFacturar();

    const { select } = mockFindMany.mock.calls[0][0] as { select: Record<string, unknown> };
    expect(select).toMatchObject({
      estado_factura: { select: { descripcion: true } },
    });
  });

  it("selects only the latest cotización (take: 1, orderBy id_cotizacion desc)", async () => {
    mockFindMany.mockResolvedValue([]);

    await getPedidosParaFacturar();

    const { select } = mockFindMany.mock.calls[0][0] as {
      select: { cotizaciones: Record<string, unknown> };
    };
    expect(select.cotizaciones).toMatchObject({
      take: 1,
      orderBy: { id_cotizacion: "desc" },
    });
  });

  it("selects all seven datos_facturacion fiscal fields", async () => {
    mockFindMany.mockResolvedValue([]);

    await getPedidosParaFacturar();

    const { select } = mockFindMany.mock.calls[0][0] as {
      select: { datos_facturacion: { select: Record<string, boolean> } };
    };
    expect(select.datos_facturacion.select).toEqual({
      rfc: true,
      razon_social: true,
      tipo_persona: true,
      regimen_fiscal: true,
      uso_cfdi: true,
      codigo_postal_fiscal: true,
      correo_facturacion: true,
    });
  });

  // ── Return shapes ────────────────────────────────────────────────────────────

  it("returns an empty array when no pedidos match", async () => {
    mockFindMany.mockResolvedValue([]);
    expect(await getPedidosParaFacturar()).toEqual([]);
  });

  it("returns datos_facturacion as null when a pedido has no billing data", async () => {
    mockFindMany.mockResolvedValue([pedido({ datos_facturacion: null as never })]);

    const result = await getPedidosParaFacturar();

    expect(result[0].datos_facturacion).toBeNull();
  });

  it("returns estado_factura as null when no invoice state is set", async () => {
    mockFindMany.mockResolvedValue([pedido({ estado_factura: null as never })]);

    const result = await getPedidosParaFacturar();

    expect(result[0].estado_factura).toBeNull();
  });

  it("returns numero_factura when the order was already invoiced", async () => {
    mockFindMany.mockResolvedValue([pedido({ facturado: true, numero_factura: "FAC-2024-099" })]);

    const result = await getPedidosParaFacturar();

    expect(result[0].numero_factura).toBe("FAC-2024-099");
  });

  // ── Error propagation ────────────────────────────────────────────────────────

  it("propagates Prisma errors to the caller", async () => {
    mockFindMany.mockRejectedValue(new Error("DB connection lost"));

    await expect(getPedidosParaFacturar()).rejects.toThrow("DB connection lost");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getPedidoFacturacion
// ─────────────────────────────────────────────────────────────────────────────
describe("getPedidoFacturacion", () => {
  beforeEach(() => jest.clearAllMocks());

  // ── Where clause ────────────────────────────────────────────────────────────

  it("uses findUnique (not findMany) to fetch a single record", async () => {
    mockFindUnique.mockResolvedValue(BASE_PEDIDO);

    await getPedidoFacturacion(1);

    expect(mockFindUnique).toHaveBeenCalledTimes(1);
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it("queries by id_pedido and requires factura=true", async () => {
    mockFindUnique.mockResolvedValue(BASE_PEDIDO);

    await getPedidoFacturacion(42);

    expect(mockFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id_pedido: 42, factura: true },
      })
    );
  });

  it("passes the correct id for different inputs", async () => {
    mockFindUnique.mockResolvedValue(null);

    await getPedidoFacturacion(999);

    expect(mockFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id_pedido: 999, factura: true } })
    );
  });

  // ── Return values ────────────────────────────────────────────────────────────

  it("returns the pedido when found", async () => {
    mockFindUnique.mockResolvedValue(BASE_PEDIDO);

    const result = await getPedidoFacturacion(1);

    expect(result).not.toBeNull();
    expect(result?.id_pedido).toBe(1);
    expect(result?.cliente.nombre_cliente).toBe("Ana López");
  });

  it("returns null when no pedido matches the id or factura=true filter", async () => {
    mockFindUnique.mockResolvedValue(null);

    expect(await getPedidoFacturacion(999)).toBeNull();
  });

  it("returns facturado=true and numero_factura for an already-invoiced order", async () => {
    mockFindUnique.mockResolvedValue(pedido({ facturado: true, numero_factura: "FAC-2024-007" }));

    const result = await getPedidoFacturacion(1);

    expect(result?.facturado).toBe(true);
    expect(result?.numero_factura).toBe("FAC-2024-007");
  });

  it("returns null datos_facturacion for pedidos without billing data", async () => {
    mockFindUnique.mockResolvedValue(pedido({ datos_facturacion: null as never }));

    const result = await getPedidoFacturacion(1);

    expect(result?.datos_facturacion).toBeNull();
  });

  // ── Select shape ─────────────────────────────────────────────────────────────

  it("selects only the latest cotización (take: 1, orderBy id_cotizacion desc)", async () => {
    mockFindUnique.mockResolvedValue(BASE_PEDIDO);

    await getPedidoFacturacion(1);

    const { select } = mockFindUnique.mock.calls[0][0] as {
      select: { cotizaciones: Record<string, unknown> };
    };
    expect(select.cotizaciones).toMatchObject({
      take: 1,
      orderBy: { id_cotizacion: "desc" },
    });
  });

  it("selects all seven datos_facturacion fiscal fields", async () => {
    mockFindUnique.mockResolvedValue(BASE_PEDIDO);

    await getPedidoFacturacion(1);

    const { select } = mockFindUnique.mock.calls[0][0] as {
      select: { datos_facturacion: { select: Record<string, boolean> } };
    };
    expect(select.datos_facturacion.select).toEqual({
      rfc: true,
      razon_social: true,
      tipo_persona: true,
      regimen_fiscal: true,
      uso_cfdi: true,
      codigo_postal_fiscal: true,
      correo_facturacion: true,
    });
  });

  // ── Error propagation ────────────────────────────────────────────────────────

  it("propagates Prisma errors to the caller", async () => {
    mockFindUnique.mockRejectedValue(new Error("Timeout"));

    await expect(getPedidoFacturacion(1)).rejects.toThrow("Timeout");
  });
});
