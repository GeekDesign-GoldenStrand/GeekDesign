"use client";

import { useState, useMemo } from "react";

import {
  TopClientesCard,
  type TopClienteRow,
} from "@/components/admin/metricas/organisms/TopClientesCard";
import type { TopClientesResult } from "@/lib/services/metricas";

export function ClientesTab({ data }: { data: TopClientesResult }) {
  const [year, setYear] = useState<number | "all">("all");

  const rows = useMemo<TopClienteRow[]>(() => {
    const mapped = data.clientes.map((c) => {
      const scope = year === "all" ? null : c.porAno[year];
      const monto = year === "all" ? c.total : (scope?.total ?? 0);
      const numPedidos = year === "all" ? c.numPedidos : (scope?.numPedidos ?? 0);
      return {
        id_cliente: c.id_cliente,
        nombre: c.nombre,
        empresa: c.empresa,
        categoria: c.categoria,
        monto,
        numPedidos,
      };
    });
    return mapped
      .filter((c) => c.monto > 0)
      .sort((a, b) => b.monto - a.monto)
      .slice(0, 10);
  }, [data.clientes, year]);

  const totalScope = rows.reduce((sum, r) => sum + r.monto, 0);

  return (
    <div className="space-y-6 sm:space-y-8 max-w-[1600px] mx-auto pb-12 sm:pb-16 pt-4 sm:pt-6 px-4 md:px-6 lg:px-8">
      <TopClientesCard
        rows={rows}
        totalScope={totalScope}
        year={year}
        availableYears={data.availableYears}
        onYearChange={setYear}
      />
    </div>
  );
}
