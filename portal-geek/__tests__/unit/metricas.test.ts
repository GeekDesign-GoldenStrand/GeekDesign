import { prisma } from "@/lib/db/client";
import {
  getMetricasDashboard,
  getIngresosMensualesPorAno,
  getMetricasMaquinas,
} from "@/lib/services/metricas";

jest.mock("@/lib/db/client", () => ({
  prisma: {
    pagos: {
      findMany: jest.fn(),
    },
    detallePedido: {
      findMany: jest.fn(),
    },
  },
}));

describe("metricas service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("getMetricasDashboard", () => {
    it("should return correct revenue grouped by year and month", async () => {
      (prisma.pagos.findMany as jest.Mock).mockResolvedValue([
        {
          fecha: new Date("2024-05-10T12:00:00Z"),
          monto_pago: 1000,
        },
        {
          fecha: new Date("2024-05-20T12:00:00Z"),
          monto_pago: 500,
        },
        {
          fecha: new Date("2025-01-05T12:00:00Z"),
          monto_pago: 2000,
        },
      ]);

      const result = await getMetricasDashboard();

      // 2024 checks
      expect(result[2024]).toBeDefined();
      expect(result[2024].length).toBe(12);
      expect(result[2024][4].ingresos).toBe(1500); // Mayo (índice 4)
      expect(result[2024][0].ingresos).toBe(0); // Enero

      // 2025 checks
      expect(result[2025]).toBeDefined();
      expect(result[2025].length).toBe(12);
      expect(result[2025][0].ingresos).toBe(2000); // Enero (índice 0)
    });

    it("should return empty current year array if no data exists", async () => {
      (prisma.pagos.findMany as jest.Mock).mockResolvedValue([]);

      const result = await getMetricasDashboard();
      const currentYear = new Date().getUTCFullYear();

      expect(result[currentYear]).toBeDefined();
      expect(result[currentYear].length).toBe(12);
      expect(result[currentYear][0].ingresos).toBe(0);
    });

    it("should handle database errors and throw a custom error", async () => {
      (prisma.pagos.findMany as jest.Mock).mockRejectedValue(
        new Error("Database connection failed")
      );

      await expect(getMetricasDashboard()).rejects.toThrow(
        "No se pudieron cargar las métricas en este momento."
      );
    });
  });

  describe("getIngresosMensualesPorAno", () => {
    it("should return monthly data for a specific year", async () => {
      (prisma.pagos.findMany as jest.Mock).mockResolvedValue([
        {
          fecha: new Date("2026-03-15T10:00:00Z"),
          monto_pago: 300,
        },
        {
          fecha: new Date("2026-03-20T10:00:00Z"),
          monto_pago: 100,
        },
        {
          fecha: new Date("2026-11-01T10:00:00Z"),
          monto_pago: 500,
        },
      ]);

      const result = await getIngresosMensualesPorAno(2026);

      expect(result.length).toBe(12);
      expect(result[2].ingresos).toBe(400); // Marzo (índice 2)
      expect(result[10].ingresos).toBe(500); // Noviembre (índice 10)
    });

    it("should handle database errors and throw a custom error", async () => {
      (prisma.pagos.findMany as jest.Mock).mockRejectedValue(new Error("DB Error"));

      await expect(getIngresosMensualesPorAno(2026)).rejects.toThrow(
        "No se pudieron cargar las métricas en este momento."
      );
    });
  });

  describe("getMetricasMaquinas", () => {
    it("should correctly group and sort machines usage by year and month", async () => {
      (prisma.detallePedido.findMany as jest.Mock).mockResolvedValue([
        {
          fecha_modificacion: new Date("2026-06-10T12:00:00Z"),
          id_material: "mat-1",
          pedido: {
            pedidoMaquinas: [
              {
                id_material: "mat-1",
                id_maquina: "maq-1",
                maquina: { nombre_maquina: "Cortadora Láser", apodo_maquina: "Láser" },
              },
              {
                id_material: "mat-2",
                id_maquina: "maq-2",
                maquina: { nombre_maquina: "Bordadora", apodo_maquina: "Borda" },
              },
            ],
          },
        },
        {
          fecha_modificacion: new Date("2026-06-15T12:00:00Z"),
          id_material: "mat-1",
          pedido: {
            pedidoMaquinas: [
              {
                id_material: "mat-1",
                id_maquina: "maq-1",
                maquina: { nombre_maquina: "Cortadora Láser", apodo_maquina: "Láser" },
              },
            ],
          },
        },
        {
          fecha_modificacion: new Date("2025-01-05T12:00:00Z"),
          id_material: "mat-2",
          pedido: {
            pedidoMaquinas: [
              {
                id_material: "mat-2",
                id_maquina: "maq-2",
                maquina: { nombre_maquina: "Bordadora", apodo_maquina: "Borda" },
              },
            ],
          },
        },
      ]);

      const result = await getMetricasMaquinas();

      // 2026 checks
      expect(result[2026]).toBeDefined();
      expect(result[2026][5]).toBeDefined(); // Junio (índice 5)
      expect(result[2026][5].length).toBe(1);
      expect(result[2026][5][0].nombre_maquina).toBe("Cortadora Láser");
      expect(result[2026][5][0].apodo_maquina).toBe("Láser");
      expect(result[2026][5][0].veces_usada).toBe(2);

      // 2025 checks
      expect(result[2025]).toBeDefined();
      expect(result[2025][0]).toBeDefined(); // Enero (índice 0)
      expect(result[2025][0].length).toBe(1);
      expect(result[2025][0][0].nombre_maquina).toBe("Bordadora");
      expect(result[2025][0][0].apodo_maquina).toBe("Borda");
      expect(result[2025][0][0].veces_usada).toBe(1);
    });

    it("should handle empty dataset", async () => {
      (prisma.detallePedido.findMany as jest.Mock).mockResolvedValue([]);
      const result = await getMetricasMaquinas();
      const currentYear = new Date().getUTCFullYear();
      expect(result[currentYear]).toBeDefined();
      expect(result[currentYear][0]).toEqual([]); // Array de máquinas vacío por defecto
    });

    it("should handle database errors", async () => {
      (prisma.detallePedido.findMany as jest.Mock).mockRejectedValue(new Error("DB timeout"));
      await expect(getMetricasMaquinas()).rejects.toThrow(
        "No se pudieron cargar las métricas de máquinas en este momento."
      );
    });
  });
});
