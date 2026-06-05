"use client";

import { useState, useMemo } from "react";

import {
  IngresosMaquinasCard,
  type IngresosMaquinaRow,
} from "@/components/admin/metricas/organisms/IngresosMaquinasCard";
import type { IngresosMaquinasResult } from "@/lib/services/metricas";

export function MaquinasTab({ data }: { data: IngresosMaquinasResult }) {
  const [year, setYear] = useState<number | "all">("all");

  const rows = useMemo<IngresosMaquinaRow[]>(() => {
    const mapped = data.maquinas.map((m) => {
      const scope = year === "all" ? null : m.porAno[year];
      const monto = year === "all" ? m.total : (scope?.total ?? 0);
      const numPedidos = year === "all" ? m.numPedidos : (scope?.numPedidos ?? 0);
      return {
        id_maquina: m.id_maquina,
        nombre: m.nombre,
        apodo: m.apodo,
        tipo: m.tipo,
        monto,
        numPedidos,
      };
    });
    return mapped.filter((m) => m.monto > 0).sort((a, b) => b.monto - a.monto);
  }, [data.maquinas, year]);

  const totalScope = rows.reduce((sum, r) => sum + r.monto, 0);

  return (
    <div className="space-y-6 sm:space-y-8 max-w-[1600px] mx-auto pb-12 sm:pb-16 pt-4 sm:pt-6 px-4 md:px-6 lg:px-8">
      <IngresosMaquinasCard
        rows={rows}
        totalScope={totalScope}
        year={year}
        availableYears={data.availableYears}
        onYearChange={setYear}
      />
    </div>
  );
}
