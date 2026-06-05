"use client";

import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell, Legend } from "recharts";

import { SelectField } from "../../atoms/SelectField";
import { TOOLTIP_ITEM_STYLE, TOOLTIP_LABEL_STYLE, TOOLTIP_CONTENT_STYLE } from "../utils";

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

const PIE_COLORS = [
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
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-5 sm:mb-8 gap-4 xl:gap-6">
        <div className="flex flex-col gap-2">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              Máquinas Más Usadas Mensualmente
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Por volumen de servicios terminados
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          {/* Toggle de Top 5 / Top 10 */}
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-gray-50/50 p-1">
            <button
              onClick={() => onLimitChange(5)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                topLimit === 5
                  ? "bg-white text-gray-900 shadow-sm border border-gray-200"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Top 5
            </button>
            <button
              onClick={() => onLimitChange(10)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                topLimit === 10
                  ? "bg-white text-gray-900 shadow-sm border border-gray-200"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Top 10
            </button>
          </div>

          <SelectField
            value={selectedMonth}
            options={monthOptions}
            onChange={(val) => onMonthChange(Number(val))}
            selectClassName="text-sm px-3 py-2 border border-gray-200 rounded-lg text-gray-700 bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />

          <SelectField
            value={selectedYear}
            options={yearOptions}
            onChange={(val) => onYearChange(Number(val))}
            selectClassName="text-sm px-3 py-2 border border-gray-200 rounded-lg text-gray-700 bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
              <Tooltip
                cursor={{ fill: "transparent" }}
                formatter={(value: number, name: string) => [
                  <span key="val" className="font-bold text-gray-900">
                    {value}
                  </span>,
                  name,
                ]}
                contentStyle={TOOLTIP_CONTENT_STYLE}
                itemStyle={TOOLTIP_ITEM_STYLE}
                labelStyle={TOOLTIP_LABEL_STYLE}
              />
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
