/**
 * @jest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react";

import { useMaquinasMetricsAnual } from "@/components/admin/metricas/hooks/useMaquinasMetricsAnual";
import type { MetricasMaquinasData } from "@/lib/services/metricas";

describe("useMaquinasMetricsAnual", () => {
  const currentYear = new Date().getUTCFullYear();

  const mockData: MetricasMaquinasData = {
    [currentYear]: {
      0: [
        { id_maquina: 1, nombre_maquina: "Máquina A", apodo_maquina: "A", veces_usada: 50 },
        { id_maquina: 2, nombre_maquina: "Máquina B", apodo_maquina: "B", veces_usada: 30 },
      ],
      1: [
        { id_maquina: 1, nombre_maquina: "Máquina A", apodo_maquina: "A", veces_usada: 20 }, // Total A = 70
        { id_maquina: 3, nombre_maquina: "Máquina C", apodo_maquina: "C", veces_usada: 90 }, // Total C = 90
      ],
    },
    [currentYear - 1]: {
      11: [
        { id_maquina: 9, nombre_maquina: "Máquina Vieja", apodo_maquina: "Vieja", veces_usada: 5 },
      ],
    },
  };

  it("should initialize with current year and default limits", () => {
    const { result } = renderHook(() => useMaquinasMetricsAnual(mockData));

    expect(result.current.selectedYear).toBe(currentYear);
    expect(result.current.topLimit).toBe(5);
  });

  it("should aggregate data from all months for the selected year", () => {
    const { result } = renderHook(() => useMaquinasMetricsAnual(mockData));

    // Expected order:
    // 1. Máquina C (90)
    // 2. Máquina A (70)
    // 3. Máquina B (30)

    expect(result.current.chartData.length).toBe(3);
    expect(result.current.chartData[0].nombre_maquina).toBe("Máquina C");
    expect(result.current.chartData[0].veces_usada).toBe(90);

    expect(result.current.chartData[1].nombre_maquina).toBe("Máquina A");
    expect(result.current.chartData[1].veces_usada).toBe(70);

    expect(result.current.chartData[2].nombre_maquina).toBe("Máquina B");
    expect(result.current.chartData[2].veces_usada).toBe(30);
  });

  it("should limit chart data based on topLimit state", () => {
    // Modify mock to have more than 5 elements for current year
    const largeMock = { ...mockData };
    largeMock[currentYear][2] = [
      { id_maquina: 4, nombre_maquina: "M4", apodo_maquina: "M4", veces_usada: 10 },
      { id_maquina: 5, nombre_maquina: "M5", apodo_maquina: "M5", veces_usada: 10 },
      { id_maquina: 6, nombre_maquina: "M6", apodo_maquina: "M6", veces_usada: 10 },
      { id_maquina: 7, nombre_maquina: "M7", apodo_maquina: "M7", veces_usada: 10 },
    ];

    const { result } = renderHook(() => useMaquinasMetricsAnual(largeMock));

    // Total machines = A, B, C + M4, M5, M6, M7 (7 machines)
    // Initially limits to top 5
    expect(result.current.chartData.length).toBe(5);

    // Change limit to 10
    act(() => {
      result.current.setTopLimit(10);
    });

    expect(result.current.topLimit).toBe(10);
    expect(result.current.chartData.length).toBe(7); // Total available is 7
  });

  it("should update chart data when year changes", () => {
    const { result } = renderHook(() => useMaquinasMetricsAnual(mockData));

    act(() => {
      result.current.setSelectedYear(currentYear - 1);
    });

    expect(result.current.selectedYear).toBe(currentYear - 1);
    expect(result.current.chartData.length).toBe(1);
    expect(result.current.chartData[0].nombre_maquina).toBe("Máquina Vieja");
  });

  it("should handle empty data safely", () => {
    const { result } = renderHook(() => useMaquinasMetricsAnual({}));

    expect(result.current.availableYears).toEqual([currentYear]);
    expect(result.current.chartData).toEqual([]);
  });
});
