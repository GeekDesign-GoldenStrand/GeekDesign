"use client";

import { useState, useEffect } from "react";

import { useDashboardFinanciero } from "@/components/admin/metricas/hooks/useDashboardFinanciero";
import { CustomComparisonChart } from "@/components/admin/metricas/organisms/CustomComparisonChart";
import { DesgloseMensualChart } from "@/components/admin/metricas/organisms/DesgloseMensualChart";
import { IngresosAnualesCard } from "@/components/admin/metricas/organisms/IngresosAnualesCard";
import { IngresosMensualesCard } from "@/components/admin/metricas/organisms/IngresosMensualesCard";
import { MetricasGeneralesCard } from "@/components/admin/metricas/organisms/MetricasGeneralesCard";
import type { MetricasDashboardData } from "@/lib/services/metricas";

type WidgetId =
  | "ingresos_anuales"
  | "ingresos_mensuales"
  | "comparativa_historica"
  | "desglose_mensual"
  | "comparativa_personalizada";

interface GeneralConfig {
  cards: WidgetId[];
  charts: WidgetId[];
}

const DEFAULT_CONFIG: GeneralConfig = {
  cards: ["ingresos_anuales", "ingresos_mensuales"],
  charts: ["comparativa_historica", "desglose_mensual"],
};

export function GeneralTab({
  data,
  isEditing,
}: {
  data: MetricasDashboardData;
  isEditing: boolean;
}) {
  const [config, setConfig] = useState<GeneralConfig>(DEFAULT_CONFIG);
  const [isMounted, setIsMounted] = useState(false);

  // Hook with all the state
  const dashboardState = useDashboardFinanciero(data);

  // Load from localStorage
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
    const saved = localStorage.getItem("dashboard_general_config");
    if (saved) {
      try {
        setConfig(JSON.parse(saved));
      } catch (e) {
        console.error("Error parsing dashboard config", e);
      }
    }
  }, []);

  // Save to localStorage
  const saveConfig = (newConfig: GeneralConfig) => {
    setConfig(newConfig);
    localStorage.setItem("dashboard_general_config", JSON.stringify(newConfig));
  };

  const handleToggleWidget = (type: "cards" | "charts", id: WidgetId) => {
    const current = config[type];
    if (current.includes(id)) {
      saveConfig({ ...config, [type]: current.filter((w) => w !== id) });
    } else {
      // Validate limits (3 cards, 5 charts)
      if (type === "cards" && current.length >= 3) {
        alert("El límite es de 3 métricas tipo 'Card'.");
        return;
      }
      if (type === "charts" && current.length >= 5) {
        alert("El límite es de 5 gráficas.");
        return;
      }
      saveConfig({ ...config, [type]: [...current, id] });
    }
  };

  if (!isMounted) return <div className="min-h-screen" />;

  return (
    <div className="space-y-6 sm:space-y-8 max-w-[1600px] mx-auto pb-12 sm:pb-16 px-4 md:px-6 lg:px-8 relative">
      {isEditing && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-8 mt-4">
          <h3 className="text-xl font-bold text-[#1e1e1e] mb-4">Configuración de Vista General</h3>
          <p className="text-[#8e908f] text-sm mb-6">
            Selecciona los componentes que deseas ver en tu panel principal. Puedes elegir hasta 3
            Tarjetas de Resumen (Cards) y hasta 5 Gráficas (Charts).
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Cards Config */}
            <div>
              <h4 className="font-semibold text-lg mb-3 flex items-center justify-between text-black">
                <span>Tarjetas (Cards)</span>
                <span className="text-sm font-medium text-black">{config.cards.length} / 3</span>
              </h4>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl hover:bg-gray-50 cursor-pointer text-black">
                  <input
                    type="checkbox"
                    className="w-5 h-5 accent-[#e42200]"
                    checked={config.cards.includes("ingresos_anuales")}
                    onChange={() => handleToggleWidget("cards", "ingresos_anuales")}
                  />
                  <span className="font-medium text-black">Ingresos Anuales</span>
                </label>
                <label className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl hover:bg-gray-50 cursor-pointer text-black">
                  <input
                    type="checkbox"
                    className="w-5 h-5 accent-[#e42200]"
                    checked={config.cards.includes("ingresos_mensuales")}
                    onChange={() => handleToggleWidget("cards", "ingresos_mensuales")}
                  />
                  <span className="font-medium text-black">Ingresos Mensuales</span>
                </label>
              </div>
            </div>

            {/* Charts Config */}
            <div>
              <h4 className="font-semibold text-lg mb-3 flex items-center justify-between text-black">
                <span>Gráficas (Charts)</span>
                <span className="text-sm font-medium text-black">{config.charts.length} / 5</span>
              </h4>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl hover:bg-gray-50 cursor-pointer text-black">
                  <input
                    type="checkbox"
                    className="w-5 h-5 accent-[#e42200]"
                    checked={config.charts.includes("comparativa_historica")}
                    onChange={() => handleToggleWidget("charts", "comparativa_historica")}
                  />
                  <span className="font-medium text-black">Comparativa Histórica</span>
                </label>
                <label className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl hover:bg-gray-50 cursor-pointer text-black">
                  <input
                    type="checkbox"
                    className="w-5 h-5 accent-[#e42200]"
                    checked={config.charts.includes("desglose_mensual")}
                    onChange={() => handleToggleWidget("charts", "desglose_mensual")}
                  />
                  <span className="font-medium text-black">Desglose Mensual</span>
                </label>
                <label className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl hover:bg-gray-50 cursor-pointer text-black">
                  <input
                    type="checkbox"
                    className="w-5 h-5 accent-[#e42200]"
                    checked={config.charts.includes("comparativa_personalizada")}
                    onChange={() => handleToggleWidget("charts", "comparativa_personalizada")}
                  />
                  <span className="font-medium text-black">Comparativa Personalizada</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── KPI Cards ── */}
      {config.cards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {config.cards.includes("ingresos_anuales") && (
            <IngresosAnualesCard
              year={dashboardState.card1Year}
              onYearChange={dashboardState.setCard1Year}
              availableYears={dashboardState.availableYears}
              totalAnual={dashboardState.totalAnual}
              prevTotalAnual={dashboardState.prevTotalAnual}
            />
          )}
          {config.cards.includes("ingresos_mensuales") && (
            <IngresosMensualesCard
              month={dashboardState.card2Month}
              year={dashboardState.card2Year}
              onMonthChange={dashboardState.setCard2Month}
              onYearChange={dashboardState.setCard2Year}
              availableYears={dashboardState.availableYears}
              totalMensual={dashboardState.totalMensual}
              prevTotalMensual={dashboardState.prevTotalMensual}
              prevMonth={dashboardState.prevMonth}
              prevYear={dashboardState.prevYear}
            />
          )}
        </div>
      )}

      {/* ── Charts Grid ── */}
      {config.charts.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-8">
          {config.charts.includes("comparativa_historica") && (
            <MetricasGeneralesCard
              availableYears={dashboardState.availableYears}
              selectedYears={dashboardState.card3Years}
              yearlyTotals={dashboardState.yearlyTotals}
              latestYear={dashboardState.latestYear}
              previousYear={dashboardState.previousYear}
              card3DeltaCurrent={dashboardState.card3DeltaCurrent}
              card3DeltaPrev={dashboardState.card3DeltaPrev}
              onToggleYear={dashboardState.toggleCard3Year}
            />
          )}
          {config.charts.includes("desglose_mensual") && (
            <DesgloseMensualChart
              year={dashboardState.card4Year}
              onYearChange={dashboardState.setCard4Year}
              availableYears={dashboardState.availableYears}
              chartStyle={dashboardState.chartStyle}
              onChartStyleChange={dashboardState.setChartStyle}
              data={dashboardState.card4Data}
            />
          )}
        </div>
      )}

      {/* ── Full Width Charts ── */}
      {config.charts.includes("comparativa_personalizada") && (
        <CustomComparisonChart
          customPeriods={dashboardState.customPeriods}
          availableYears={dashboardState.availableYears}
          customData={dashboardState.customData}
          getValue={dashboardState.getCustomValue}
          onAdd={dashboardState.handleAddPeriod}
          onRemove={dashboardState.handleRemovePeriod}
          onChangeMonth={dashboardState.handleChangeMonth}
          onChangeYear={dashboardState.handleChangeYear}
        />
      )}

      {config.cards.length === 0 && config.charts.length === 0 && !isEditing && (
        <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
          <p className="text-gray-500 mb-4 text-lg">
            No has seleccionado ninguna métrica para mostrar.
          </p>
          <p className="text-gray-500">
            Usa el botón &quot;Configurar Vista&quot; de arriba para agregar métricas.
          </p>
        </div>
      )}
    </div>
  );
}
