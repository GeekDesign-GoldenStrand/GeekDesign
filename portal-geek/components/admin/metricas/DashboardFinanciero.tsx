"use client";

import { useState } from "react";

import type { MetricasDashboardData } from "@/lib/services/metricas";

import { CustomComparisonChart } from "./organisms/CustomComparisonChart";
import { DesgloseMensualChart } from "./organisms/DesgloseMensualChart";
import { IngresosAnualesCard } from "./organisms/IngresosAnualesCard";
import { IngresosMensualesCard } from "./organisms/IngresosMensualesCard";
import { MetricasGeneralesCard } from "./organisms/MetricasGeneralesCard";

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export function DashboardFinanciero({ data }: { data: MetricasDashboardData }) {
  const availableYears = Object.keys(data)
    .map(Number)
    .sort((a, b) => b - a);

  const initialYear = availableYears.length > 0 ? availableYears[0] : new Date().getFullYear();

  // ── Card 1: Ingresos Anuales ──
  const [card1Year, setCard1Year] = useState<number>(initialYear);
  const card1Data = data[card1Year] || [];
  const totalAnual = card1Data.reduce((acc, curr) => acc + curr.ingresos, 0);
  const prevCard1Data = data[card1Year - 1] || [];
  const prevTotalAnual = prevCard1Data.reduce((acc, curr) => acc + curr.ingresos, 0);

  // ── Card 2: Ingresos Mensuales ──
  const [card2Year, setCard2Year] = useState<number>(initialYear);
  const [card2Month, setCard2Month] = useState<number>(new Date().getMonth());
  const card2Data = data[card2Year] || [];
  const totalMensual = card2Data.find((m) => m.mes_num === card2Month)?.ingresos || 0;
  const prevMonth = card2Month === 0 ? 11 : card2Month - 1;
  const prevYear = card2Month === 0 ? card2Year - 1 : card2Year;
  const prevCard2Data = data[prevYear] || [];
  const prevTotalMensual = prevCard2Data.find((m) => m.mes_num === prevMonth)?.ingresos || 0;

  // ── Card 3: Comparativa Histórica ──
  const [card3Years, setCard3Years] = useState<number[]>(availableYears);
  const yearlyTotals = card3Years.map((year) => {
    const yearData = data[year] || [];
    const total = yearData.reduce((acc, curr) => acc + curr.ingresos, 0);
    return { year: String(year), total };
  });
  const sortedYears = [...card3Years].sort();
  const latestYear = sortedYears[sortedYears.length - 1];
  const previousYear = sortedYears[sortedYears.length - 2];
  let card3DeltaCurrent = 0;
  let card3DeltaPrev = 0;
  if (latestYear && previousYear) {
    card3DeltaCurrent = yearlyTotals.find((y) => y.year === String(latestYear))?.total || 0;
    card3DeltaPrev = yearlyTotals.find((y) => y.year === String(previousYear))?.total || 0;
  }
  const toggleCard3Year = (year: number) => {
    setCard3Years((prev) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year].sort((a, b) => a - b)
    );
  };

  // ── Card 4: Desglose Mensual ──
  const [card4Year, setCard4Year] = useState<number>(initialYear);
  const [chartStyle, setChartStyle] = useState<1 | 2 | 3>(3);
  const card4Data = data[card4Year] || [];

  // ── Card 5: Comparativa Personalizada ──
  const [customPeriods, setCustomPeriods] = useState<{ month: number; year: number }[]>([
    { month: 0, year: availableYears[availableYears.length - 1] || initialYear },
    { month: 11, year: availableYears[0] || initialYear },
  ]);

  const customData = customPeriods.map((p) => {
    const val = (data[p.year] || []).find((m) => m.mes_num === p.month)?.ingresos || 0;
    return {
      name: `${MONTHS[p.month].substring(0, 3)} ${p.year}`,
      value: val,
      month: p.month,
      year: p.year,
    };
  });

  const getCustomValue = (p: { month: number; year: number }) =>
    (data[p.year] || []).find((m) => m.mes_num === p.month)?.ingresos || 0;

  const handleAddPeriod = () =>
    setCustomPeriods([...customPeriods, { month: 0, year: availableYears[0] }]);

  const handleRemovePeriod = (idx: number) =>
    setCustomPeriods(customPeriods.filter((_, i) => i !== idx));

  const handleChangeMonth = (idx: number, month: number) => {
    const newP = [...customPeriods];
    newP[idx].month = month;
    setCustomPeriods(newP);
  };

  const handleChangeYear = (idx: number, year: number) => {
    const newP = [...customPeriods];
    newP[idx].year = year;
    setCustomPeriods(newP);
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-[1600px] mx-auto pb-10 pt-4 sm:pt-6 px-4 sm:px-0">
      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <IngresosAnualesCard
          year={card1Year}
          onYearChange={setCard1Year}
          availableYears={availableYears}
          totalAnual={totalAnual}
          prevTotalAnual={prevTotalAnual}
        />
        <IngresosMensualesCard
          month={card2Month}
          year={card2Year}
          onMonthChange={setCard2Month}
          onYearChange={setCard2Year}
          availableYears={availableYears}
          totalMensual={totalMensual}
          prevTotalMensual={prevTotalMensual}
          prevMonth={prevMonth}
          prevYear={prevYear}
        />
      </div>

      {/* ── Charts Grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-8">
        <MetricasGeneralesCard
          availableYears={availableYears}
          selectedYears={card3Years}
          yearlyTotals={yearlyTotals}
          latestYear={latestYear}
          previousYear={previousYear}
          card3DeltaCurrent={card3DeltaCurrent}
          card3DeltaPrev={card3DeltaPrev}
          onToggleYear={toggleCard3Year}
        />
        <DesgloseMensualChart
          year={card4Year}
          onYearChange={setCard4Year}
          availableYears={availableYears}
          chartStyle={chartStyle}
          onChartStyleChange={setChartStyle}
          data={card4Data}
        />
      </div>

      {/* ── Custom Comparison ── */}
      <CustomComparisonChart
        customPeriods={customPeriods}
        availableYears={availableYears}
        customData={customData}
        getValue={getCustomValue}
        onAdd={handleAddPeriod}
        onRemove={handleRemovePeriod}
        onChangeMonth={handleChangeMonth}
        onChangeYear={handleChangeYear}
      />
    </div>
  );
}
