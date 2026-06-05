import { prisma } from "@/lib/db/client";
import { getIngresosPorMaquina } from "@/lib/services/metricas";

jest.mock("@/lib/db/client", () => ({
  prisma: {
    pagos: {
      findMany: jest.fn(),
    },
  },
}));

const MAQ_A = { nombre_maquina: "Láser CO2", apodo_maquina: "Roja", tipo: "Láser CO2" };
const MAQ_B = { nombre_maquina: "Bordadora", apodo_maquina: "Azul", tipo: "Bordadora" };

type MaquinaLink = { id_maquina: number; maquina: typeof MAQ_A };

// Builds a payment whose order has one service line per machine group passed in.
// Each inner array represents a service and the machines linked to it.
function pago(
  id_pedido: number,
  monto: number,
  fecha: string,
  servicios: MaquinaLink[][],
  estatus = "Pagado"
) {
  return {
    fecha: new Date(fecha),
    monto_pago: monto,
    estatus_pago: estatus,
    id_pedido,
    pedido: {
      detalles: servicios.map((maquinas) => ({ servicio: { maquinas } })),
    },
  };
}

describe("getIngresosPorMaquina", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => jest.restoreAllMocks());

  it("attributes each order's full income to every machine assigned to it", async () => {
    (prisma.pagos.findMany as jest.Mock).mockResolvedValue([
      // Order with 80k paid, one service linked to machine A → A "generates"
      // more despite fewer orders.
      pago(1, 80000, "2026-03-01T12:00:00Z", [[{ id_maquina: 1, maquina: MAQ_A }]]),
      // Order with 5k, one service linked to machine B.
      pago(2, 5000, "2026-04-01T12:00:00Z", [[{ id_maquina: 2, maquina: MAQ_B }]]),
    ]);

    const { maquinas, availableYears } = await getIngresosPorMaquina();

    expect(maquinas[0]).toMatchObject({ id_maquina: 1, total: 80000, numPedidos: 1 });
    expect(maquinas[1]).toMatchObject({ id_maquina: 2, total: 5000, numPedidos: 1 });
    expect(availableYears).toEqual([2026]);
  });

  it("counts the full order income for each machine when an order has several (full attribution)", async () => {
    (prisma.pagos.findMany as jest.Mock).mockResolvedValue([
      // Two service lines, each linked to a different machine.
      pago(1, 10000, "2026-01-01T12:00:00Z", [
        [{ id_maquina: 1, maquina: MAQ_A }],
        [{ id_maquina: 2, maquina: MAQ_B }],
      ]),
    ]);

    const { maquinas } = await getIngresosPorMaquina();

    // Both machines get the full 10000 (sum across machines > order income by design).
    expect(maquinas.find((m) => m.id_maquina === 1)?.total).toBe(10000);
    expect(maquinas.find((m) => m.id_maquina === 2)?.total).toBe(10000);
  });

  it("de-duplicates a machine reached through two services of the same order", async () => {
    (prisma.pagos.findMany as jest.Mock).mockResolvedValue([
      pago(1, 3000, "2026-01-01T12:00:00Z", [
        [{ id_maquina: 1, maquina: MAQ_A }],
        [{ id_maquina: 1, maquina: MAQ_A }],
      ]),
    ]);

    const { maquinas } = await getIngresosPorMaquina();

    expect(maquinas).toHaveLength(1);
    expect(maquinas[0]).toMatchObject({ total: 3000, numPedidos: 1 });
  });

  it("subtracts refunds and breaks totals down by year", async () => {
    (prisma.pagos.findMany as jest.Mock).mockResolvedValue([
      pago(1, 10000, "2025-05-01T12:00:00Z", [[{ id_maquina: 1, maquina: MAQ_A }]]),
      pago(1, 4000, "2026-02-01T12:00:00Z", [[{ id_maquina: 1, maquina: MAQ_A }]], "Reembolsado"),
    ]);

    const { maquinas } = await getIngresosPorMaquina();

    expect(maquinas[0].total).toBe(6000); // 10000 − 4000
    expect(maquinas[0].porAno[2025]).toEqual({ total: 10000, numPedidos: 1 });
    expect(maquinas[0].porAno[2026]).toEqual({ total: -4000, numPedidos: 1 });
    // Monthly breakdown keyed `${year}-${month}` (month 0-11): May 2025, Feb 2026.
    expect(maquinas[0].porMes["2025-4"]).toEqual({ total: 10000, numPedidos: 1 });
    expect(maquinas[0].porMes["2026-1"]).toEqual({ total: -4000, numPedidos: 1 });
  });

  it("ignores payments whose order has no machine in any of its services", async () => {
    (prisma.pagos.findMany as jest.Mock).mockResolvedValue([
      // One service line with no machines linked.
      pago(1, 9999, "2026-01-01T12:00:00Z", [[]]),
    ]);

    const { maquinas, availableYears } = await getIngresosPorMaquina();

    expect(maquinas).toHaveLength(0);
    expect(availableYears).toHaveLength(0);
  });

  it("wraps database errors in a friendly message", async () => {
    (prisma.pagos.findMany as jest.Mock).mockRejectedValue(new Error("DB down"));

    await expect(getIngresosPorMaquina()).rejects.toThrow(
      "No se pudieron cargar las métricas en este momento."
    );
  });
});
