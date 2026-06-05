"use client";

import { useMaquinasMetrics } from "@/components/admin/metricas/hooks/useMaquinasMetrics";
import { useMaquinasMetricsAnual } from "@/components/admin/metricas/hooks/useMaquinasMetricsAnual";
import { MaquinasMasUsadasAnualCard } from "@/components/admin/metricas/organisms/MaquinasMasUsadasAnualCard";
import { MaquinasMasUsadasCard } from "@/components/admin/metricas/organisms/MaquinasMasUsadasCard";
import type { MetricasMaquinasData } from "@/lib/services/metricas";

interface Props {
  data: MetricasMaquinasData;
}

export function MaquinasTab({ data }: Props) {
  const metrics = useMaquinasMetrics(data);
  const anualMetrics = useMaquinasMetricsAnual(data);

  return (
    <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 auto-rows-min">
        <div className="col-span-1">
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
        <div className="col-span-1">
          <MaquinasMasUsadasAnualCard
            availableYears={anualMetrics.availableYears}
            selectedYear={anualMetrics.selectedYear}
            topLimit={anualMetrics.topLimit}
            chartData={anualMetrics.chartData}
            onYearChange={anualMetrics.setSelectedYear}
            onLimitChange={anualMetrics.setTopLimit}
          />
        </div>
      </div>
    </div>
  );
}
