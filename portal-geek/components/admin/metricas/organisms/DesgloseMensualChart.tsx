"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  ComposedChart,
} from "recharts";

import { SegmentedControl } from "@/components/ui/atoms/SegmentedControl";

import { SelectField } from "../../atoms/SelectField";
import {
  formatCurrency,
  DASHBOARD_SELECT_CLASS,
  TOOLTIP_ITEM_STYLE,
  TOOLTIP_LABEL_STYLE,
  TOOLTIP_CONTENT_STYLE,
  AXIS_TICK,
} from "../utils";

interface MonthData {
  name: string;
  ingresos: number;
  mes_num: number;
}

interface Props {
  year: number;
  onYearChange: (year: number) => void;
  availableYears: number[];
  chartStyle: 1 | 2 | 3;
  onChartStyleChange: (style: 1 | 2 | 3) => void;
  data: MonthData[];
}

export function DesgloseMensualChart({
  year,
  onYearChange,
  availableYears,
  chartStyle,
  onChartStyleChange,
  data,
}: Props) {
  const yearOptions = availableYears.map((y) => ({
    label: String(y),
    value: y,
  }));

  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsSmallScreen(window.innerWidth < 640);
    handleResize(); // Check on mount
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const chartButtons: { value: 1 | 2 | 3; label: string }[] = [
    { value: 1, label: "Barras" },
    { value: 2, label: "Área" },
    { value: 3, label: "Combinado" },
  ];

  return (
    <div className="bg-white p-5 sm:p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 sm:mb-8 gap-3 sm:gap-4">
        <div className="flex flex-col gap-2">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Desglose Mensual</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Ingresos por mes en el año seleccionado
            </p>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <SegmentedControl
              options={chartButtons}
              value={chartStyle}
              onChange={onChartStyleChange}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-3 items-center w-full sm:w-auto mt-2 sm:mt-0">
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

      <div className="w-full h-[200px] sm:h-[280px] xl:h-[320px] relative">
        <div className="absolute inset-0">
          <ResponsiveContainer width="100%" height="100%">
            {chartStyle === 1 ? (
              <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="barRed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f87171" stopOpacity={1} />
                    <stop offset="100%" stopColor="#dc2626" stopOpacity={0.9} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={AXIS_TICK}
                  dy={10}
                  interval={0}
                  angle={isSmallScreen ? -45 : 0}
                  textAnchor={isSmallScreen ? "end" : "middle"}
                  height={isSmallScreen ? 50 : 30}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={AXIS_TICK}
                  tickFormatter={(val) => `$${val / 1000}k`}
                  width={45}
                />
                <Tooltip
                  cursor={{ fill: "#f3f4f6" }}
                  formatter={(
                    value: any /* eslint-disable-line @typescript-eslint/no-explicit-any */
                  ) => [formatCurrency(Number(value) || 0), "Ingresos"]}
                  contentStyle={TOOLTIP_CONTENT_STYLE}
                  itemStyle={TOOLTIP_ITEM_STYLE}
                  labelStyle={TOOLTIP_LABEL_STYLE}
                />
                <Bar dataKey="ingresos" fill="url(#barRed)" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            ) : chartStyle === 2 ? (
              <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={AXIS_TICK}
                  dy={10}
                  interval={0}
                  angle={isSmallScreen ? -45 : 0}
                  textAnchor={isSmallScreen ? "end" : "middle"}
                  height={isSmallScreen ? 50 : 30}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={AXIS_TICK}
                  tickFormatter={(val) => `$${val / 1000}k`}
                  width={45}
                />
                <Tooltip
                  formatter={(
                    value: any /* eslint-disable-line @typescript-eslint/no-explicit-any */
                  ) => [formatCurrency(Number(value) || 0), "Ingresos"]}
                  contentStyle={TOOLTIP_CONTENT_STYLE}
                  itemStyle={TOOLTIP_ITEM_STYLE}
                  labelStyle={TOOLTIP_LABEL_STYLE}
                />
                <Area
                  type="monotone"
                  dataKey="ingresos"
                  stroke="#ef4444"
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#colorIngresos)"
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </AreaChart>
            ) : (
              <ComposedChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="barRedLight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fca5a5" stopOpacity={1} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={AXIS_TICK}
                  dy={10}
                  interval={0}
                  angle={isSmallScreen ? -45 : 0}
                  textAnchor={isSmallScreen ? "end" : "middle"}
                  height={isSmallScreen ? 50 : 30}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={AXIS_TICK}
                  tickFormatter={(val) => `$${val / 1000}k`}
                  width={45}
                />
                <Tooltip
                  cursor={{ fill: "#f3f4f6" }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    return (
                      <div
                        style={{
                          ...TOOLTIP_CONTENT_STYLE,
                          background: "#fff",
                          padding: "10px 14px",
                        }}
                      >
                        <p style={{ ...TOOLTIP_LABEL_STYLE, marginBottom: 4 }}>{label}</p>
                        <p style={TOOLTIP_ITEM_STYLE}>
                          Ingresos: {formatCurrency(Number(payload[0]?.value) || 0)}
                        </p>
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="ingresos"
                  barSize={36}
                  fill="url(#barRedLight)"
                  radius={[6, 6, 0, 0]}
                />
                <Line
                  type="monotone"
                  dataKey="ingresos"
                  stroke="#ef4444"
                  strokeWidth={4}
                  dot={{ r: 5, fill: "#ef4444", strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 7 }}
                />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
