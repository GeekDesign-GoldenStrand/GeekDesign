import { useMemo, useState } from "react";

import type { MetricasMaquinasData } from "@/lib/services/metricas";

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export function useMaquinasMetrics(data: MetricasMaquinasData) {
  const currentYear = new Date().getUTCFullYear();
  const currentMonth = new Date().getUTCMonth();

  const availableYears = useMemo(() => {
    const years = Object.keys(data)
      .map(Number)
      .sort((a, b) => b - a);
    if (!years.includes(currentYear)) years.unshift(currentYear);
    return years;
  }, [data, currentYear]);

  const [selectedYear, setSelectedYear] = useState<number>(() =>
    availableYears.includes(currentYear) ? currentYear : availableYears[0]
  );
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [topLimit, setTopLimit] = useState<5 | 10>(5);

  const availableMonths = useMemo(() => MONTHS.map((name, index) => ({ name, value: index })), []);

  const chartData = useMemo(() => {
    const yearData = data[selectedYear] || {};
    const monthData = yearData[selectedMonth] || [];

    // El backend ya lo retorna ordenado por veces_usada de mayor a menor,
    // pero aseguramos recortar al límite seleccionado (Top 5 o Top 10)
    return monthData.slice(0, topLimit);
  }, [data, selectedYear, selectedMonth, topLimit]);

  return {
    availableYears,
    availableMonths,
    selectedYear,
    setSelectedYear,
    selectedMonth,
    setSelectedMonth,
    topLimit,
    setTopLimit,
    chartData,
  };
}
