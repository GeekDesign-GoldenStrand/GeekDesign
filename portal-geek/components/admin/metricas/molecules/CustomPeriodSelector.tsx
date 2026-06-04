"use client";

import { SelectField } from "../../atoms/SelectField";
import { DeltaBadge } from "../atoms/DeltaBadge";
import { formatCurrency, MONTHS, CUSTOM_SELECT_CLASS } from "../utils";

interface CustomPeriod {
  month: number;
  year: number;
}

interface Props {
  idx: number;
  period: CustomPeriod | undefined;
  allPeriods: CustomPeriod[];
  availableYears: number[];
  basePeriod: CustomPeriod;
  baseValue: number;
  getValue: (p: CustomPeriod) => number;
  onAdd: () => void;
  onRemove: (idx: number) => void;
  onChangeMonth: (idx: number, month: number) => void;
  onChangeYear: (idx: number, year: number) => void;
}

export function CustomPeriodSelector({
  idx,
  period,
  availableYears,
  basePeriod,
  baseValue,
  getValue,
  onAdd,
  onRemove,
  onChangeMonth,
  onChangeYear,
}: Props) {
  if (!period) {
    return (
      <button
        onClick={onAdd}
        className="h-full min-h-[160px] border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-400 hover:text-purple-600 hover:border-purple-300 hover:bg-purple-50 transition-all group"
      >
        <div className="bg-gray-100 p-3 rounded-full group-hover:bg-purple-100 mb-3 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 4v16m8-8H4"
            ></path>
          </svg>
        </div>
        <span className="font-semibold text-sm">Añadir Periodo</span>
      </button>
    );
  }

  const val = getValue(period);
  const isBase = idx === 0;
  const baseName = `${MONTHS[basePeriod.month].substring(0, 3)} ${basePeriod.year}`;

  const monthOptions = MONTHS.map((m, i) => ({
    label: m.substring(0, 3),
    value: i,
  }));

  const yearOptions = availableYears.map((y) => ({
    label: String(y),
    value: y,
  }));

  return (
    <div
      className={`p-5 rounded-2xl border ${
        isBase ? "bg-purple-50 border-purple-200" : "bg-white border-gray-200"
      } shadow-sm relative flex flex-col justify-between min-h-[160px]`}
    >
      {idx > 1 && (
        <button
          onClick={() => onRemove(idx)}
          className="absolute top-3 right-3 text-gray-400 hover:text-red-500 bg-white hover:bg-red-50 rounded-full p-1 transition-colors border border-transparent hover:border-red-100 z-10"
          title="Eliminar periodo"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            ></path>
          </svg>
        </button>
      )}

      <div>
        <div className="flex items-center gap-2 mb-4 relative z-0 flex-wrap">
          <SelectField
            label="Mes:"
            value={period.month}
            options={monthOptions}
            onChange={(v) => onChangeMonth(idx, Number(v))}
            inline
            selectClassName={CUSTOM_SELECT_CLASS}
          />
          <SelectField
            label="Año:"
            value={period.year}
            options={yearOptions}
            onChange={(v) => onChangeYear(idx, Number(v))}
            inline
            selectClassName={CUSTOM_SELECT_CLASS}
          />
        </div>

        <p className="text-2xl font-extrabold text-gray-900 tracking-tight">
          {formatCurrency(val)}
        </p>
      </div>

      <div className="mt-4">
        {!isBase ? (
          <div className="flex items-center gap-2">
            <DeltaBadge current={val} previous={baseValue} />
            <span className="text-sm font-bold text-gray-400 uppercase tracking-widest hidden xl:inline-block">
              vs {baseName}
            </span>
          </div>
        ) : (
          <div className="inline-block px-3 py-1.5 rounded-md bg-purple-100 border border-purple-200">
            <span className="text-sm font-bold text-purple-700 uppercase tracking-widest">
              Periodo Base
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
