"use client";

import { useId } from "react";
import { Legend, Pie, PieChart, ResponsiveContainer, Tooltip, Cell } from "recharts";

import { SegmentedControl } from "@/components/ui/atoms/SegmentedControl";
import type { MaquinaMetric } from "@/lib/services/metricas";

import { SelectField } from "../../atoms/SelectField";
import { DASHBOARD_SELECT_CLASS } from "../utils";

import { MaquinasCustomTooltip } from "./MaquinasCustomTooltip";

interface Props {
  availableYears: number[];
  selectedYear: number;
  topLimit: 5 | 10;
  chartData: MaquinaMetric[];
  onYearChange: (y: number) => void;
  onLimitChange: (l: 5 | 10) => void;
}

const PIE_COLORS_ANUAL = [
  "var(--color-sky-500, #0ea5e9)",
  "var(--color-emerald-500, #10b981)",
  "var(--color-amber-500, #f59e0b)",
  "var(--color-rose-500, #f43f5e)",
  "var(--color-fuchsia-500, #d946ef)",
  "var(--color-teal-500, #14b8a6)",
  "var(--color-lime-500, #84cc16)",
  "var(--color-purple-500, #a855f7)",
  "var(--color-cyan-500, #06b6d4)",
];

export function MaquinasMasUsadasAnualCard({
  availableYears,
  selectedYear,
  topLimit,
  chartData,
  onYearChange,
  onLimitChange,
}: Props) {
  const chartId = useId();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 flex flex-col h-full hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div className="flex flex-col gap-2">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              Máquinas Más Usadas Anualmente
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Acumulado de todo el año</p>
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

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <SelectField
            label="Año:"
            value={selectedYear}
            options={availableYears.map((y) => ({ label: String(y), value: y }))}
            onChange={(val) => onYearChange(Number(val))}
            inline
            selectClassName={DASHBOARD_SELECT_CLASS}
          />
        </div>
      </div>

      <div className="flex-1 min-h-[300px] sm:min-h-[350px] w-full relative">
        {chartData.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
            No hay datos para este año
          </div>
        ) : (
          <div className="absolute inset-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  {chartData.map((entry, index) => (
                    <filter key={`shadow-${index}`} id={`shadow-${chartId}-${index}`}>
                      <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.2" />
                    </filter>
                  ))}
                </defs>
                <Tooltip content={<MaquinasCustomTooltip />} cursor={{ fill: "transparent" }} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: "13px", paddingTop: "20px" }}
                />
                <Pie
                  data={chartData}
                  dataKey="veces_usada"
                  nameKey="apodo_maquina"
                  cx="50%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius="80%"
                  paddingAngle={2}
                  animationDuration={1500}
                  animationEasing="ease-out"
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS_ANUAL[index % PIE_COLORS_ANUAL.length]}
                      style={{
                        outline: "none",
                      }}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
