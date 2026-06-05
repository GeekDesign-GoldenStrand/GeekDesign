"use client";

import { useMaquinasMetrics } from "@/components/admin/metricas/hooks/useMaquinasMetrics";
import { useMaquinasMetricsAnual } from "@/components/admin/metricas/hooks/useMaquinasMetricsAnual";
import { useMaquinasMetricsHistorico } from "@/components/admin/metricas/hooks/useMaquinasMetricsHistorico";
import { MaquinasMasUsadasAnualCard } from "@/components/admin/metricas/organisms/MaquinasMasUsadasAnualCard";
import { MaquinasMasUsadasCard } from "@/components/admin/metricas/organisms/MaquinasMasUsadasCard";
import { MaquinasMasUsadasHistoricoCard } from "@/components/admin/metricas/organisms/MaquinasMasUsadasHistoricoCard";
import type { MetricasMaquinasData } from "@/lib/services/metricas";

export function MaquinasTab({ data }: { data: MetricasMaquinasData }) {
  const maquinasState = useMaquinasMetrics(data);
  const maquinasAnualState = useMaquinasMetricsAnual(data);
  const maquinasHistoricoState = useMaquinasMetricsHistorico(data);

  return (
    <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 auto-rows-min">
        <div className="col-span-1">
          <MaquinasMasUsadasCard
            availableYears={maquinasState.availableYears}
            availableMonths={maquinasState.availableMonths}
            selectedYear={maquinasState.selectedYear}
            selectedMonth={maquinasState.selectedMonth}
            topLimit={maquinasState.topLimit}
            chartData={maquinasState.chartData}
            onYearChange={maquinasState.setSelectedYear}
            onMonthChange={maquinasState.setSelectedMonth}
            onLimitChange={maquinasState.setTopLimit}
          />
        </div>
        <div className="col-span-1">
          <MaquinasMasUsadasAnualCard
            availableYears={maquinasAnualState.availableYears}
            selectedYear={maquinasAnualState.selectedYear}
            topLimit={maquinasAnualState.topLimit}
            chartData={maquinasAnualState.chartData}
            onYearChange={maquinasAnualState.setSelectedYear}
            onLimitChange={maquinasAnualState.setTopLimit}
          />
        </div>
        <div className="lg:col-span-2">
          <MaquinasMasUsadasHistoricoCard
            topLimit={maquinasHistoricoState.topLimit}
            chartData={maquinasHistoricoState.chartData}
            onLimitChange={maquinasHistoricoState.setTopLimit}
          />
        </div>
      </div>
    </div>
  );
}
