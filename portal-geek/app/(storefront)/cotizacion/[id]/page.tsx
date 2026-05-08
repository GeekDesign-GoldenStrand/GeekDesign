"use client";

import { use } from "react";
import { WarningCircle } from "@phosphor-icons/react";
import { FolioSearchBar } from "@/components/storefront/molecules/FolioSearchBar";
import { QuoteStatusBanner } from "@/components/storefront/organisms/QuoteStatusBanner";
import { QuoteStepper } from "@/components/storefront/organisms/QuoteStepper";
import { QuoteServicesTable } from "@/components/storefront/organisms/QuoteServicesTable";
import { QuoteSummary } from "@/components/storefront/organisms/QuoteSummary";
import { MOCK_SCENARIOS } from "@/lib/mocks/cotizaciones";

export default function CotizacionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  // Convertimos a lowercase para que 'Validada' o 'validada' funcionen igual
  const scenarioId = resolvedParams.id.toLowerCase();
  const data = MOCK_SCENARIOS[scenarioId] || MOCK_SCENARIOS["203"];

  return (
    <main key={data.id} className="min-h-screen bg-[#fcfcfc] pb-20">
      <div className="max-w-[1240px] mx-auto px-4 pt-10">
        
        {/* Molecule: Unified Search Block */}
        <div className="mb-16">
          <FolioSearchBar initialValue={resolvedParams.id} />
        </div>

        {/* Atom-like Page Header */}
        <div className="mb-8">
          <h2 className="text-[24px] font-bold text-[#1e1e1e]">Cotización #{data.id}</h2>
          <p className="text-[#8e908f] text-[16px]">Solicitada el {data.fecha_solicitud}</p>
        </div>

        {/* Organism: Status Banner */}
        <QuoteStatusBanner status={data.estado_actual} />

        {/* Organism: Stepper Progress */}
        <QuoteStepper pasos={data.pasos} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Organism: Services Table */}
          <div className="lg:col-span-2">
            <QuoteServicesTable servicios={data.servicios} />

            <div className="mt-8 p-6 bg-blue-50 border border-blue-100 rounded-[12px] flex items-start gap-4">
               <WarningCircle size={24} className="text-blue-600 shrink-0 mt-0.5" />
               <p className="text-[14px] text-blue-900 leading-relaxed">
                 Al confirmar esta cotización, aceptas los cambios realizados en los servicios marcados como <span className="font-bold underline decoration-blue-400">modificados</span> y reconoces que los servicios <span className="font-bold underline decoration-red-400 text-red-700">rechazados</span> no formarán parte del pedido final.
               </p>
            </div>
          </div>

          {/* Organism: Summary & Actions Sidebar */}
          <QuoteSummary 
            resumen={data.resumen} 
            counts={{
              aprobados: data.servicios.filter((s: any) => s.estado === 'sin_cambios').length,
              modificados: data.servicios.filter((s: any) => s.estado === 'modificado').length,
              rechazados: data.servicios.filter((s: any) => s.estado === 'rechazado').length
            }}
            actionText={
              data.estado_actual === 'modificada' ? "Revisar y confirmar cambios" :
              data.estado_actual === 'rechazada' ? "Finalizar y seguir comprando" :
              "Aceptar cotización y continuar"
            }
          />

        </div>
      </div>
    </main>
  );
}
