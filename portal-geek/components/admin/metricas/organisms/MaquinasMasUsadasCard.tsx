"use client";

import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell, Legend } from "recharts";

import { SelectField } from "@/components/admin/atoms/SelectField";
import { SegmentedControl } from "@/components/ui/atoms/SegmentedControl";

import { DASHBOARD_SELECT_CLASS } from "../utils";

import { MaquinasCustomTooltip } from "./MaquinasCustomTooltip";

interface Props {
  availableYears: number[];
  availableMonths: { name: string; value: number }[];
  selectedYear: number;
  selectedMonth: number;
  topLimit: 5 | 10;
  chartData: { id_maquina: number; apodo_maquina: string; veces_usada: number }[];
  onYearChange: (val: number) => void;
  onMonthChange: (val: number) => void;
  onLimitChange: (val: 5 | 10) => void;
}

export const PIE_COLORS = [
  "var(--color-red-500, #ef4444)",
  "var(--color-orange-500, #f97316)",
  "var(--color-yellow-500, #eab308)",
  "var(--color-green-500, #22c55e)",
  "var(--color-cyan-500, #06b6d4)",
  "var(--color-blue-500, #3b82f6)",
  "var(--color-indigo-500, #6366f1)",
  "var(--color-violet-500, #8b5cf6)",
  "var(--color-pink-500, #ec4899)",
];

export function MaquinasMasUsadasCard({
  availableYears,
  availableMonths,
  selectedYear,
  selectedMonth,
  topLimit,
  chartData,
  onYearChange,
  onMonthChange,
  onLimitChange,
}: Props) {
  const displayData = chartData;

  const monthOptions = availableMonths.map((m) => ({ label: m.name, value: m.value }));
  const yearOptions = availableYears.map((y) => ({ label: String(y), value: y }));

  return (
    <div className="bg-white p-5 sm:p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 sm:mb-8 gap-4 sm:gap-6">
        <div className="flex flex-col gap-2">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              Máquinas Más Usadas Mensualmente
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Por volumen de servicios terminados
            </p>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <SegmentedControl
              options={[
                { label: "Top 5", value: 5 },
                { label: "Top 10", value: 10 },
              ]}
              value={topLimit}
              onChange={(val) => onLimitChange(val as 5 | 10)}
            />
          </div>
        </div>

        <div className="flex flex-wrap justify-start sm:justify-end items-center gap-3 w-full sm:w-auto">
          <SelectField
            label="Mes:"
            value={selectedMonth}
            options={monthOptions}
            onChange={(val) => onMonthChange(Number(val))}
            inline
            selectClassName={DASHBOARD_SELECT_CLASS}
          />

          <SelectField
            label="Año:"
            value={selectedYear}
            options={yearOptions}
            onChange={(val) => onYearChange(Number(val))}
            inline
            selectClassName={DASHBOARD_SELECT_CLASS}
          />
        </div>
      </div>

      <div className="w-full flex-grow min-h-[300px] sm:min-h-[400px]">
        {displayData.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-sm text-gray-400">
            No hay servicios terminados en este periodo.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={displayData}
                dataKey="veces_usada"
                nameKey="apodo_maquina"
                cx="50%"
                cy="50%"
                innerRadius="50%"
                outerRadius="80%"
                paddingAngle={4}
                animationDuration={1500}
                animationEasing="ease-out"
                stroke="none"
              >
                {displayData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<MaquinasCustomTooltip />} cursor={{ fill: "transparent" }} />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                wrapperStyle={{
                  paddingTop: "20px",
                  fontWeight: 600,
                  fontSize: "13px",
                  color: "var(--color-gray-600, #4b5563)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
