import { prisma } from "@/lib/db/client";
import { getTopClientes } from "@/lib/services/metricas";

jest.mock("@/lib/db/client", () => ({
  prisma: {
    pagos: {
      findMany: jest.fn(),
    },
  },
}));

function pago(
  id_pedido: number,
  id_cliente: number,
  monto: number,
  fecha: string,
  cliente: { nombre_cliente: string; empresa: string | null; categoria: string | null }
) {
  return {
    fecha: new Date(fecha),
    monto_pago: monto,
    id_pedido,
    pedido: { id_cliente, cliente },
  };
}

const ACME = { nombre_cliente: "Acme", empresa: "Acme SA", categoria: "Gold" };
const BETA = { nombre_cliente: "Beta", empresa: null, categoria: null };

describe("getTopClientes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("aggregates revenue per client and ranks descending by all-time total", async () => {
    (prisma.pagos.findMany as jest.Mock).mockResolvedValue([
      pago(1, 10, 1000, "2025-03-01T12:00:00Z", ACME),
      pago(2, 10, 500, "2026-01-10T12:00:00Z", ACME),
      pago(3, 20, 2000, "2025-06-01T12:00:00Z", BETA),
    ]);

    const { clientes, availableYears } = await getTopClientes();

    expect(clientes).toHaveLength(2);
    // Acme = 1500, Beta = 2000 → Beta ranks first
    expect(clientes[0].id_cliente).toBe(20);
    expect(clientes[0].total).toBe(2000);
    expect(clientes[1].id_cliente).toBe(10);
    expect(clientes[1].total).toBe(1500);
    expect(availableYears).toEqual([2026, 2025]);
  });

  it("counts distinct orders and breaks totals down by year", async () => {
    (prisma.pagos.findMany as jest.Mock).mockResolvedValue([
      // Two payments on the same order in 2025 → still one distinct order.
      pago(1, 10, 600, "2025-03-01T12:00:00Z", ACME),
      pago(1, 10, 400, "2025-04-01T12:00:00Z", ACME),
      pago(2, 10, 500, "2026-02-01T12:00:00Z", ACME),
    ]);

    const { clientes } = await getTopClientes();

    expect(clientes[0].numPedidos).toBe(2); // orders 1 and 2
    expect(clientes[0].total).toBe(1500);
    expect(clientes[0].porAno[2025]).toEqual({ total: 1000, numPedidos: 1 });
    expect(clientes[0].porAno[2026]).toEqual({ total: 500, numPedidos: 1 });
  });

  it("ignores payments without a parent order", async () => {
    (prisma.pagos.findMany as jest.Mock).mockResolvedValue([
      { fecha: new Date("2025-01-01T00:00:00Z"), monto_pago: 999, id_pedido: 7, pedido: null },
    ]);

    const { clientes, availableYears } = await getTopClientes();

    expect(clientes).toHaveLength(0);
    expect(availableYears).toHaveLength(0);
  });

  it("wraps database errors in a friendly message", async () => {
    (prisma.pagos.findMany as jest.Mock).mockRejectedValue(new Error("DB down"));

    await expect(getTopClientes()).rejects.toThrow(
      "No se pudieron cargar las métricas en este momento."
    );
  });
});
