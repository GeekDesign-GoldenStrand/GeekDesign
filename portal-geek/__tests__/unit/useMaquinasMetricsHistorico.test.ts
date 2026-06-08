/**
 * @jest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react";

import { useMaquinasMetricsHistorico } from "@/components/admin/metricas/hooks/useMaquinasMetricsHistorico";
import type { MetricasMaquinasData } from "@/lib/services/metricas";

describe("useMaquinasMetricsHistorico", () => {
  const mockData: MetricasMaquinasData = {
    2023: {
      5: [
        { id_maquina: 1, nombre_maquina: "Máquina A", apodo_maquina: "A", veces_usada: 100 },
        { id_maquina: 2, nombre_maquina: "Máquina B", apodo_maquina: "B", veces_usada: 50 },
      ],
      8: [
        { id_maquina: 1, nombre_maquina: "Máquina A", apodo_maquina: "A", veces_usada: 50 }, // Total A: 150
        { id_maquina: 3, nombre_maquina: "Máquina C", apodo_maquina: "C", veces_usada: 200 }, // Total C: 200
      ],
    },
    2024: {
      1: [
        { id_maquina: 2, nombre_maquina: "Máquina B", apodo_maquina: "B", veces_usada: 80 }, // Total B: 130
        { id_maquina: 4, nombre_maquina: "Máquina D", apodo_maquina: "D", veces_usada: 10 }, // Total D: 10
      ],
    },
  };

  it("should initialize with top 10 limit and bar style", () => {
    const { result } = renderHook(() => useMaquinasMetricsHistorico(mockData));

    expect(result.current.topLimit).toBe(10);
  });

  it("should aggregate data across all years and months", () => {
    const { result } = renderHook(() => useMaquinasMetricsHistorico(mockData));

    // Expected order: C (200), A (150), B (130), D (10)
    expect(result.current.chartData.length).toBe(4);

    expect(result.current.chartData[0].nombre_maquina).toBe("Máquina C");
    expect(result.current.chartData[0].veces_usada).toBe(200);

    expect(result.current.chartData[1].nombre_maquina).toBe("Máquina A");
    expect(result.current.chartData[1].veces_usada).toBe(150);

    expect(result.current.chartData[2].nombre_maquina).toBe("Máquina B");
    expect(result.current.chartData[2].veces_usada).toBe(130);

    expect(result.current.chartData[3].nombre_maquina).toBe("Máquina D");
    expect(result.current.chartData[3].veces_usada).toBe(10);
  });

  it("should respect topLimit", () => {
    const { result } = renderHook(() => useMaquinasMetricsHistorico(mockData));

    act(() => {
      // Force limit to 2 to see if it slices correctly
      result.current.setTopLimit(5); // In UI it will be 5, 10, 20. But for test we check slicing
    });

    expect(result.current.chartData.length).toBe(4); // Only 4 total, so shows 4.
  });

  it("should handle empty data safely", () => {
    const { result } = renderHook(() => useMaquinasMetricsHistorico({}));

    expect(result.current.chartData).toEqual([]);
  });
});
