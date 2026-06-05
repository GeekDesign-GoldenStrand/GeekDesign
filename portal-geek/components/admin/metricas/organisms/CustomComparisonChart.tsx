"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

import { CustomPeriodSelector } from "../molecules/CustomPeriodSelector";
import {
  formatCurrency,
  TOOLTIP_ITEM_STYLE,
  TOOLTIP_LABEL_STYLE,
  TOOLTIP_CONTENT_STYLE,
  AXIS_TICK_LARGE,
  AXIS_TICK,
} from "../utils";

interface CustomPeriod {
  month: number;
  year: number;
}

interface CustomDataPoint {
  name: string;
  value: number;
  month: number;
  year: number;
}

interface Props {
  customPeriods: CustomPeriod[];
  availableYears: number[];
  customData: CustomDataPoint[];
  getValue: (p: CustomPeriod) => number;
  onAdd: () => void;
  onRemove: (idx: number) => void;
  onChangeMonth: (idx: number, month: number) => void;
  onChangeYear: (idx: number, year: number) => void;
}

export function CustomComparisonChart({
  customPeriods,
  availableYears,
  customData,
  getValue,
  onAdd,
  onRemove,
  onChangeMonth,
  onChangeYear,
}: Props) {
  const basePeriod = customPeriods[0];
  const baseValue = basePeriod ? getValue(basePeriod) : 0;

  return (
    <div className="bg-white p-5 sm:p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow">
      <div className="mb-5 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900">Comparativa Personalizada</h2>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Compara de 2 a 4 periodos específicos de tiempo. Añade nuevos selectores para comparar más
          meses.
        </p>
      </div>

      {/* Intuitive Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5 sm:mb-8">
        {[0, 1, 2, 3].map((idx) => (
          <CustomPeriodSelector
            key={idx}
            idx={idx}
            period={customPeriods[idx]}
            allPeriods={customPeriods}
            availableYears={availableYears}
            basePeriod={basePeriod}
            baseValue={baseValue}
            getValue={getValue}
            onAdd={onAdd}
            onRemove={onRemove}
            onChangeMonth={onChangeMonth}
            onChangeYear={onChangeYear}
          />
        ))}
      </div>

      {/* Custom Comparison Chart */}
      <div className="h-[250px] sm:h-[340px] md:h-[400px] bg-gray-50 rounded-2xl p-4 sm:p-6 border border-gray-100">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={customData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="barPurple" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c084fc" stopOpacity={1} />
                <stop offset="100%" stopColor="#7e22ce" stopOpacity={0.9} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={AXIS_TICK_LARGE}
              dy={10}
              interval={0}
            />
            <YAxis
              tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
              axisLine={false}
              tickLine={false}
              tick={AXIS_TICK}
              width={45}
            />
            <Tooltip
              cursor={{ fill: "#f3f4f6" }}
              formatter={(
                value: any /* eslint-disable-line @typescript-eslint/no-explicit-any */
              ) => [formatCurrency(Number(value)), "Ingreso"]}
              contentStyle={TOOLTIP_CONTENT_STYLE}
              itemStyle={TOOLTIP_ITEM_STYLE}
              labelStyle={TOOLTIP_LABEL_STYLE}
            />
            <Bar dataKey="value" fill="url(#barPurple)" radius={[6, 6, 0, 0]} maxBarSize={100} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
