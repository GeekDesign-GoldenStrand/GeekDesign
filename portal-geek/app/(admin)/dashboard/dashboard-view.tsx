"use client";

import { Gear } from "@phosphor-icons/react";
import { useState } from "react";

import { ServiceFilterButton } from "@/components/admin/atoms/ServiceFilterButton";
import { ClientesTab } from "@/components/admin/dashboard/templates/ClientesTab";
import { GeneralTab } from "@/components/admin/dashboard/templates/GeneralTab";
import { MaquinasTab } from "@/components/admin/dashboard/templates/MaquinasTab";
import { DashboardFinanciero } from "@/components/admin/metricas/DashboardFinanciero";
import { AdminHeader } from "@/components/admin/organisms/AdminHeader";
import type {
  MetricasDashboardData,
  MetricasMaquinasData,
  TopClientesResult,
} from "@/lib/services/metricas";

export type DashboardTab = "General" | "Ingresos" | "Máquinas" | "Clientes" | "Gastos";

const TABS: DashboardTab[] = ["General", "Ingresos", "Máquinas", "Clientes", "Gastos"];

interface Props {
  data: MetricasDashboardData;
  maquinasData: MetricasMaquinasData;
  topClientes: TopClientesResult;
}

export function DashboardView({ data, maquinasData, topClientes }: Props) {
  const [activeTab, setActiveTab] = useState<DashboardTab>("General");
  const [isEditingConfig, setIsEditingConfig] = useState(false);

  return (
    <div className="space-y-6">
      <AdminHeader title="Dashboard" />

      {/* Navigation Tabs */}
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 pt-4 md:pt-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-start gap-4 pb-2">
          <div className="min-w-0 overflow-x-auto">
            <div className="flex items-center gap-3 min-w-max">
              {TABS.map((tab) => (
                <ServiceFilterButton
                  key={tab}
                  label={tab}
                  active={activeTab === tab}
                  onClick={() => {
                    setActiveTab(tab);
                    if (tab !== "General") setIsEditingConfig(false);
                  }}
                />
              ))}
            </div>
          </div>
          {activeTab === "General" && (
            <button
              type="button"
              onClick={() => setIsEditingConfig(!isEditingConfig)}
              className="flex items-center gap-2 px-4 py-2 bg-white text-neutral-900 border border-neutral-300 hover:bg-neutral-100 rounded-full text-sm font-semibold transition whitespace-nowrap"
            >
              <Gear size={18} weight="bold" />
              {isEditingConfig ? "Cerrar Configuración" : "Configurar Vista"}
            </button>
          )}
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-2">
        {activeTab === "General" && (
          <GeneralTab
            data={data}
            maquinasData={maquinasData}
            topClientesData={topClientes}
            isEditing={isEditingConfig}
          />
        )}
        {activeTab === "Ingresos" && <DashboardFinanciero data={data} />}
        {activeTab === "Máquinas" && <MaquinasTab data={maquinasData} />}
        {activeTab === "Clientes" && <ClientesTab data={topClientes} />}
        {/* Blank for the empty tabs */}
        {["Gastos"].includes(activeTab) && <div className="min-h-[400px]" />}
      </div>
    </div>
  );
}
