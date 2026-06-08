import { useMemo, useState } from "react";

import type { MetricasMaquinasData } from "@/lib/services/metricas";

export function useMaquinasMetricsAnual(data: MetricasMaquinasData) {
  const currentYear = new Date().getUTCFullYear();

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
  const [topLimit, setTopLimit] = useState<5 | 10>(5);

  const chartData = useMemo(() => {
    const yearData = data[selectedYear] || {};

    const machineMap = new Map();
    for (const monthMachines of Object.values(yearData)) {
      for (const m of monthMachines) {
        if (!machineMap.has(m.id_maquina)) {
          machineMap.set(m.id_maquina, { ...m, veces_usada: 0 });
        }
        machineMap.get(m.id_maquina).veces_usada += m.veces_usada;
      }
    }

    const processedData = Array.from(machineMap.values());
    processedData.sort((a, b) => b.veces_usada - a.veces_usada);

    return processedData.slice(0, topLimit);
  }, [data, selectedYear, topLimit]);

  return {
    availableYears,
    selectedYear,
    setSelectedYear,
    topLimit,
    setTopLimit,
    chartData,
  };
}
