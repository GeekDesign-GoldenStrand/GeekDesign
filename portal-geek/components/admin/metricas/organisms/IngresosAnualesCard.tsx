"use client";

import { SelectField } from "../../atoms/SelectField";
import { DeltaBadge } from "../atoms/DeltaBadge";
import { formatCurrency, DASHBOARD_SELECT_CLASS } from "../utils";

interface Props {
  year: number;
  onYearChange: (year: number) => void;
  availableYears: number[];
  totalAnual: number;
  prevTotalAnual: number;
}

export function IngresosAnualesCard({
  year,
  onYearChange,
  availableYears,
  totalAnual,
  prevTotalAnual,
}: Props) {
  const yearOptions = availableYears.map((y) => ({
    label: String(y),
    value: y,
  }));

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
      <div className="flex justify-between items-center mb-3 sm:mb-4">
        <h2 className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-wider">
          Ingresos Totales (Anual)
        </h2>
        <SelectField
          label="Año:"
          value={year}
          options={yearOptions}
          onChange={(v) => onYearChange(Number(v))}
          inline
          selectClassName={DASHBOARD_SELECT_CLASS}
        />
      </div>
      <div className="mt-2">
        <p className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
          {formatCurrency(totalAnual)}
        </p>
        <div className="mt-3">
          <DeltaBadge current={totalAnual} previous={prevTotalAnual} />
        </div>
        <p className="text-xs sm:text-sm text-gray-500 mt-3 sm:mt-4 font-medium uppercase tracking-wider">
          vs Año Pasado ({year - 1})
        </p>
      </div>
    </div>
  );
}
