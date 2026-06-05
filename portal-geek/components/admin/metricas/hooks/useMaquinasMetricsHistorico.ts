import { useMemo, useState } from "react";

import type { MetricasMaquinasData } from "@/lib/services/metricas";

export function useMaquinasMetricsHistorico(data: MetricasMaquinasData) {
  const [topLimit, setTopLimit] = useState<5 | 10 | 20>(10);

  const chartData = useMemo(() => {
    const machineMap = new Map();

    for (const yearData of Object.values(data)) {
      for (const monthMachines of Object.values(yearData)) {
        for (const m of monthMachines) {
          if (!machineMap.has(m.id_maquina)) {
            machineMap.set(m.id_maquina, { ...m, veces_usada: 0 });
          }
          machineMap.get(m.id_maquina).veces_usada += m.veces_usada;
        }
      }
    }

    const processedData = Array.from(machineMap.values());
    processedData.sort((a, b) => b.veces_usada - a.veces_usada);

    return processedData.slice(0, topLimit);
  }, [data, topLimit]);

  return {
    topLimit,
    setTopLimit,
    chartData,
  };
}
