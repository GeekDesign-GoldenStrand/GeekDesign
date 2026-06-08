"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { SegmentedControl } from "@/components/ui/atoms/SegmentedControl";
import type { MaquinaMetric } from "@/lib/services/metricas";

import { MaquinasCustomTooltip } from "./MaquinasCustomTooltip";

interface Props {
  topLimit: 5 | 10;
  chartData: MaquinaMetric[];
  onLimitChange: (l: 5 | 10) => void;
}

const HISTORICO_COLORS = [
  "var(--color-indigo-500, #6366f1)",
  "var(--color-pink-500, #ec4899)",
  "var(--color-orange-500, #f97316)",
  "var(--color-cyan-500, #06b6d4)",
  "var(--color-violet-500, #8b5cf6)",
  "var(--color-yellow-500, #eab308)",
  "var(--color-teal-500, #14b8a6)",
  "var(--color-red-500, #ef4444)",
  "var(--color-emerald-500, #10b981)",
  "var(--color-sky-500, #0ea5e9)",
  "var(--color-fuchsia-500, #d946ef)",
  "var(--color-amber-500, #f59e0b)",
  "var(--color-blue-500, #3b82f6)",
  "var(--color-rose-500, #f43f5e)",
  "var(--color-lime-500, #84cc16)",
];

export function MaquinasMasUsadasHistoricoCard({ topLimit, chartData, onLimitChange }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 flex flex-col h-full hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div className="flex flex-col gap-2">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Top Máquinas Histórico</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Acumulado de todos los años</p>
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

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
          {/* Empty right side container to maintain flex layout if we need to add things later */}
        </div>
      </div>

      <div className="flex-1 min-h-[350px] sm:min-h-[450px] w-full relative mt-4">
        {chartData.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
            No hay datos históricos disponibles
          </div>
        ) : (
          <div className="absolute inset-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                <XAxis
                  type="number"
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                  axisLine={{ stroke: "#E5E7EB" }}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="apodo_maquina"
                  tick={{ fill: "#374151", fontSize: 13, fontWeight: 500 }}
                  axisLine={{ stroke: "#E5E7EB" }}
                  tickLine={false}
                  width={80}
                />
                <Tooltip content={<MaquinasCustomTooltip />} cursor={{ fill: "transparent" }} />
                <Bar
                  dataKey="veces_usada"
                  radius={[0, 6, 6, 0]}
                  barSize={Math.max(20, 40 - chartData.length)} // Adjust bar size dynamically
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={HISTORICO_COLORS[index % HISTORICO_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
