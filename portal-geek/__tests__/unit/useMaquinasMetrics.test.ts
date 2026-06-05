/**
 * @jest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react";

import { useMaquinasMetrics } from "@/components/admin/metricas/hooks/useMaquinasMetrics";
import type { MetricasMaquinasData } from "@/lib/services/metricas";

describe("useMaquinasMetrics", () => {
  const currentYear = new Date().getUTCFullYear();
  const currentMonth = new Date().getUTCMonth();

  const mockData: MetricasMaquinasData = {
    [currentYear]: {
      0: [
        { id_maquina: 1, nombre_maquina: "Máquina A", apodo_maquina: "A", veces_usada: 50 },
        { id_maquina: 2, nombre_maquina: "Máquina B", apodo_maquina: "B", veces_usada: 30 },
      ],
      [currentMonth]: [
        { id_maquina: 3, nombre_maquina: "Máquina X", apodo_maquina: "X", veces_usada: 100 },
        { id_maquina: 4, nombre_maquina: "Máquina Y", apodo_maquina: "Y", veces_usada: 80 },
        { id_maquina: 5, nombre_maquina: "Máquina Z", apodo_maquina: "Z", veces_usada: 60 },
        { id_maquina: 6, nombre_maquina: "Máquina W", apodo_maquina: "W", veces_usada: 40 },
        { id_maquina: 7, nombre_maquina: "Máquina V", apodo_maquina: "V", veces_usada: 20 },
        { id_maquina: 8, nombre_maquina: "Máquina U", apodo_maquina: "U", veces_usada: 10 },
      ],
    },
    [currentYear - 1]: {
      11: [
        { id_maquina: 9, nombre_maquina: "Máquina Vieja", apodo_maquina: "Vieja", veces_usada: 5 },
      ],
    },
  };

  it("should initialize with current year and month", () => {
    const { result } = renderHook(() => useMaquinasMetrics(mockData));

    expect(result.current.selectedYear).toBe(currentYear);
    expect(result.current.selectedMonth).toBe(currentMonth);
    expect(result.current.topLimit).toBe(5);
  });

  it("should populate available years dynamically including current year", () => {
    const { result } = renderHook(() => useMaquinasMetrics(mockData));

    expect(result.current.availableYears).toEqual([currentYear, currentYear - 1]);
    expect(result.current.availableMonths.length).toBe(12);
    expect(result.current.availableMonths[0].name).toBe("Enero");
  });

  it("should limit chart data based on topLimit state", () => {
    const { result } = renderHook(() => useMaquinasMetrics(mockData));

    // Initially limits to top 5
    expect(result.current.chartData.length).toBe(5);
    expect(result.current.chartData[0].nombre_maquina).toBe("Máquina X");

    // Change limit to 10
    act(() => {
      result.current.setTopLimit(10);
    });

    expect(result.current.topLimit).toBe(10);
    expect(result.current.chartData.length).toBe(6); // Total available is 6
  });

  it("should update chart data when year or month changes", () => {
    const { result } = renderHook(() => useMaquinasMetrics(mockData));

    act(() => {
      result.current.setSelectedYear(currentYear - 1);
      result.current.setSelectedMonth(11); // Diciembre
    });

    expect(result.current.selectedYear).toBe(currentYear - 1);
    expect(result.current.selectedMonth).toBe(11);
    expect(result.current.chartData.length).toBe(1);
    expect(result.current.chartData[0].nombre_maquina).toBe("Máquina Vieja");
  });

  it("should handle empty data safely", () => {
    const { result } = renderHook(() => useMaquinasMetrics({}));

    // Even if data is empty, it should default to current year
    expect(result.current.availableYears).toEqual([currentYear]);
    expect(result.current.chartData).toEqual([]);
  });
});
