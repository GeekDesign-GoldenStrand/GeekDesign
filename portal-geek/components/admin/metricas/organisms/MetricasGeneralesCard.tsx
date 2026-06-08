"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

import { DeltaBadge } from "../atoms/DeltaBadge";
import { YearMultiSelect } from "../molecules/YearMultiSelect";
import {
  formatCurrency,
  TOOLTIP_ITEM_STYLE,
  TOOLTIP_LABEL_STYLE,
  TOOLTIP_CONTENT_STYLE,
  AXIS_TICK_LARGE,
} from "../utils";

interface Props {
  availableYears: number[];
  selectedYears: number[];
  yearlyTotals: { year: string; total: number }[];
  latestYear: number | undefined;
  previousYear: number | undefined;
  card3DeltaCurrent: number;
  card3DeltaPrev: number;
  onToggleYear: (year: number) => void;
}

export function MetricasGeneralesCard({
  availableYears,
  selectedYears,
  yearlyTotals,
  latestYear,
  previousYear,
  card3DeltaCurrent,
  card3DeltaPrev,
  onToggleYear,
}: Props) {
  return (
    <div className="bg-white p-5 sm:p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 sm:mb-8 gap-3 sm:gap-4">
        <div className="flex flex-col gap-2">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Comparativa Histórica</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Ingresos totales por año</p>
          </div>
          {latestYear && previousYear && (
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <DeltaBadge current={card3DeltaCurrent} previous={card3DeltaPrev} />
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                {latestYear} vs {previousYear}
              </span>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <YearMultiSelect
            availableYears={availableYears}
            selectedYears={selectedYears}
            onChange={onToggleYear}
          />
        </div>
      </div>
      <div className="w-full h-[200px] sm:h-[280px] xl:h-[320px] relative">
        <div className="absolute inset-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={yearlyTotals} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="barBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#60a5fa" stopOpacity={1} />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity={0.9} />
                </linearGradient>
                <linearGradient id="barLightBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#93c5fd" stopOpacity={1} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.9} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis
                dataKey="year"
                axisLine={false}
                tickLine={false}
                tick={AXIS_TICK_LARGE}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={AXIS_TICK_LARGE}
                dx={-10}
                tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                width={50}
              />
              <Tooltip
                cursor={{ fill: "#f9fafb" }}
                formatter={(
                  value: any /* eslint-disable-line @typescript-eslint/no-explicit-any */
                ) => [formatCurrency(Number(value) || 0), "Total"]}
                contentStyle={TOOLTIP_CONTENT_STYLE}
                itemStyle={TOOLTIP_ITEM_STYLE}
                labelStyle={TOOLTIP_LABEL_STYLE}
              />
              <Bar dataKey="total" radius={[8, 8, 0, 0]} maxBarSize={70}>
                {yearlyTotals.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index % 2 === 0 ? "url(#barBlue)" : "url(#barLightBlue)"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
