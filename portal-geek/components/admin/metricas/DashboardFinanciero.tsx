"use client";

import type { MetricasDashboardData } from "@/lib/services/metricas";

import { useDashboardFinanciero } from "./hooks/useDashboardFinanciero";
import { CustomComparisonChart } from "./organisms/CustomComparisonChart";
import { DesgloseMensualChart } from "./organisms/DesgloseMensualChart";
import { IngresosAnualesCard } from "./organisms/IngresosAnualesCard";
import { IngresosMensualesCard } from "./organisms/IngresosMensualesCard";
import { MetricasGeneralesCard } from "./organisms/MetricasGeneralesCard";

export function DashboardFinanciero({ data }: { data: MetricasDashboardData }) {
  const {
    availableYears,
    card1Year,
    setCard1Year,
    totalAnual,
    prevTotalAnual,
    card2Year,
    setCard2Year,
    card2Month,
    setCard2Month,
    totalMensual,
    prevTotalMensual,
    prevMonth,
    prevYear,
    card3Years,
    toggleCard3Year,
    yearlyTotals,
    latestYear,
    previousYear,
    card3DeltaCurrent,
    card3DeltaPrev,
    card4Year,
    setCard4Year,
    chartStyle,
    setChartStyle,
    card4Data,
    customPeriods,
    customData,
    getCustomValue,
    handleAddPeriod,
    handleRemovePeriod,
    handleChangeMonth,
    handleChangeYear,
  } = useDashboardFinanciero(data);

  return (
    <div className="space-y-6 sm:space-y-8 max-w-[1600px] mx-auto pb-12 sm:pb-16 pt-4 sm:pt-6 px-4 sm:px-0">
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
