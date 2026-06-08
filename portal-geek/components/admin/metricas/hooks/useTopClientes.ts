import { useState, useMemo } from "react";

import type { TopClienteRow } from "@/components/admin/metricas/organisms/TopClientesCard";
import type { TopClientesResult } from "@/lib/services/metricas";

export function useTopClientes(data: TopClientesResult | undefined) {
  const [year, setYear] = useState<number | "all">("all");

  const rows = useMemo<TopClienteRow[]>(() => {
    if (!data) return [];

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
  }, [data, year]);

  const totalScope = rows.reduce((sum, r) => sum + r.monto, 0);

  return {
    year,
    setYear,
    rows,
    totalScope,
    availableYears: data?.availableYears ?? [],
  };
}
