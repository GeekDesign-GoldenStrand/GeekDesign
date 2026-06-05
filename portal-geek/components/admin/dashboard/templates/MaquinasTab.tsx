"use client";

import { useState, useMemo } from "react";

import { SelectField } from "@/components/admin/atoms/SelectField";
import {
  IngresosMaquinasCard,
  type IngresosMaquinaRow,
} from "@/components/admin/metricas/organisms/IngresosMaquinasCard";
import { MONTHS, DASHBOARD_SELECT_CLASS } from "@/components/admin/metricas/utils";
import type { IngresosMaquinasResult } from "@/lib/services/metricas";

type Vista = "historico" | "anual" | "mensual";

const VISTAS: { value: Vista; label: string }[] = [
  { value: "historico", label: "Histórico" },
  { value: "anual", label: "Anual" },
  { value: "mensual", label: "Mensual" },
];

export function MaquinasTab({ data }: { data: IngresosMaquinasResult }) {
  const [vista, setVista] = useState<Vista>("historico");
  const defaultYear = data.availableYears[0] ?? new Date().getUTCFullYear();
  const [year, setYear] = useState<number>(defaultYear);
  const [month, setMonth] = useState<number>(new Date().getUTCMonth());

  const rows = useMemo<IngresosMaquinaRow[]>(() => {
    const mapped = data.maquinas.map((m) => {
      let scope;
      if (vista === "historico") scope = { total: m.total, numPedidos: m.numPedidos };
      else if (vista === "anual") scope = m.porAno[year];
      else scope = m.porMes[`${year}-${month}`];
      return {
        id_maquina: m.id_maquina,
        nombre: m.nombre,
        apodo: m.apodo,
        tipo: m.tipo,
        monto: scope?.total ?? 0,
        numPedidos: scope?.numPedidos ?? 0,
      };
    });
    return mapped.filter((m) => m.monto > 0).sort((a, b) => b.monto - a.monto);
  }, [data.maquinas, vista, year, month]);

  const totalScope = rows.reduce((sum, r) => sum + r.monto, 0);

  const subtitle =
    vista === "historico"
      ? "Dinero generado por cada máquina (histórico)"
      : vista === "anual"
        ? `Dinero generado en ${year}`
        : `Dinero generado en ${MONTHS[month]} ${year}`;

  const yearOptions = (data.availableYears.length > 0 ? data.availableYears : [defaultYear]).map(
    (y) => ({ label: String(y), value: y })
  );
  const monthOptions = MONTHS.map((m, i) => ({ label: m, value: i }));

  const controls = (
    <>
      <div className="flex gap-1.5">
        {VISTAS.map((v) => (
          <button
            key={v.value}
            type="button"
            onClick={() => setVista(v.value)}
            className={`px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${
              vista === v.value
                ? "bg-red-600 text-white shadow-md shadow-red-200"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>
      {vista === "mensual" && (
        <SelectField
          value={month}
          options={monthOptions}
          onChange={(v) => setMonth(Number(v))}
          inline
          selectClassName={DASHBOARD_SELECT_CLASS}
        />
      )}
      {vista !== "historico" && (
        <SelectField
          value={year}
          options={yearOptions}
          onChange={(v) => setYear(Number(v))}
          inline
          selectClassName={DASHBOARD_SELECT_CLASS}
        />
      )}
    </>
  );

  return (
    <div className="space-y-6 sm:space-y-8 max-w-[1600px] mx-auto pb-12 sm:pb-16 pt-4 sm:pt-6 px-4 md:px-6 lg:px-8">
      <IngresosMaquinasCard
        rows={rows}
        totalScope={totalScope}
        subtitle={subtitle}
        controls={controls}
      />
    </div>
  );
}
