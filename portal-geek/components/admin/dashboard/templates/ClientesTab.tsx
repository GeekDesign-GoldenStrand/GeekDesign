"use client";

import { useTopClientes } from "@/components/admin/metricas/hooks/useTopClientes";
import { TopClientesCard } from "@/components/admin/metricas/organisms/TopClientesCard";
import type { TopClientesResult } from "@/lib/services/metricas";

export function ClientesTab({ data }: { data: TopClientesResult }) {
  const { year, setYear, rows, totalScope, availableYears } = useTopClientes(data);

  return (
    <div className="space-y-6 sm:space-y-8 max-w-[1600px] mx-auto pb-12 sm:pb-16 pt-4 sm:pt-6 px-4 md:px-6 lg:px-8">
      <TopClientesCard
        rows={rows}
        totalScope={totalScope}
        year={year}
        availableYears={availableYears}
        onYearChange={setYear}
      />
    </div>
  );
}
