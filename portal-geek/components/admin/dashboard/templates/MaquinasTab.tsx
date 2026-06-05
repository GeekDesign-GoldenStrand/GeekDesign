"use client";

import { useMaquinasMetrics } from "@/components/admin/metricas/hooks/useMaquinasMetrics";
import { MaquinasMasUsadasCard } from "@/components/admin/metricas/organisms/MaquinasMasUsadasCard";
import type { MetricasMaquinasData } from "@/lib/services/metricas";

interface Props {
  data: MetricasMaquinasData;
}

export function MaquinasTab({ data }: Props) {
  const metrics = useMaquinasMetrics(data);

  return (
    <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 auto-rows-min">
        <div className="col-span-1 lg:col-span-2">
          <MaquinasMasUsadasCard
            availableYears={metrics.availableYears}
            availableMonths={metrics.availableMonths}
            selectedYear={metrics.selectedYear}
            selectedMonth={metrics.selectedMonth}
            topLimit={metrics.topLimit}
            chartData={metrics.chartData}
            onYearChange={metrics.setSelectedYear}
            onMonthChange={metrics.setSelectedMonth}
            onLimitChange={metrics.setTopLimit}
          />
        </div>
      </div>
    </div>
  );
}
