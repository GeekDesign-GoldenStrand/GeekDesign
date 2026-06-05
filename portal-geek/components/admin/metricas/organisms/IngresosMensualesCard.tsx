"use client";

import { SelectField } from "../../atoms/SelectField";
import { DeltaBadge } from "../atoms/DeltaBadge";
import { formatCurrency, MONTHS, DASHBOARD_SELECT_CLASS } from "../utils";

interface Props {
  month: number;
  year: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  availableYears: number[];
  totalMensual: number;
  prevTotalMensual: number;
  prevMonth: number;
  prevYear: number;
}

export function IngresosMensualesCard({
  month,
  year,
  onMonthChange,
  onYearChange,
  availableYears,
  totalMensual,
  prevTotalMensual,
  prevMonth,
  prevYear,
}: Props) {
  const monthOptions = MONTHS.map((m, i) => ({
    label: m,
    value: i,
  }));

  const yearOptions = availableYears.map((y) => ({
    label: String(y),
    value: y,
  }));

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 gap-2">
        <h2 className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-wider">
          Ingresos Totales (Mensual)
        </h2>
        <div className="flex gap-2 items-center flex-wrap">
          <SelectField
            label="Mes:"
            value={month}
            options={monthOptions}
            onChange={(v) => onMonthChange(Number(v))}
            inline
            selectClassName={DASHBOARD_SELECT_CLASS}
          />
          <SelectField
            label="Año:"
            value={year}
            options={yearOptions}
            onChange={(v) => onYearChange(Number(v))}
            inline
            selectClassName={DASHBOARD_SELECT_CLASS}
          />
        </div>
      </div>
      <div className="mt-2">
        <p className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
          {formatCurrency(totalMensual)}
        </p>
        <div className="mt-3">
          <DeltaBadge current={totalMensual} previous={prevTotalMensual} />
        </div>
        <p className="text-xs text-gray-500 mt-3 sm:mt-4 font-medium uppercase tracking-wider">
          vs Mes Pasado ({MONTHS[prevMonth]} {prevYear})
        </p>
      </div>
    </div>
  );
}
