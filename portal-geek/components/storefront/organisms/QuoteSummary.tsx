"use client";

import { DownloadSimple, CircleNotch } from "@phosphor-icons/react";

import { useWorkOrder } from "@/hooks/useWorkOrder";
import type { QuotationItem } from "@/types";

import { QuoteStatusCount } from "../molecules/QuoteStatusCount";

interface Resumen {
  total_anterior: number;
  total_nuevo: number;
  diferencia: number;
  porcentaje: string;
}

interface QuoteSummaryProps {
  quotationId: string;
  services: QuotationItem[];
  status: string;
  resumen: Resumen;
  counts: {
    aprobados: number;
    modificados: number;
    rechazados: number;
  };
  actionText: string;
  showCounts?: boolean;
}

export function QuoteSummary({
  quotationId,
  services,
  status,
  resumen,
  counts,
  actionText,
  showCounts = true,
}: QuoteSummaryProps) {
  const { generatePDF, isGenerating, error } = useWorkOrder();

  const handleDownload = async () => {
    await generatePDF(quotationId, services, status);
  };

  return (
    <div className="lg:col-span-1">
      <div className="bg-white rounded-[16px] border border-[#e8e8e8] p-5 md:p-8 sticky top-8 shadow-sm">
        <h3 className="text-[18px] md:text-[20px] font-bold text-[#1e1e1e] mb-6">
          Resumen de la cotización
        </h3>

        {/* Status Counts Section */}
        {showCounts && (
          <div className="space-y-5 mb-8">
            <QuoteStatusCount
              type="aprobado"
              count={counts.aprobados}
              label="Servicios aprobados"
            />
            <QuoteStatusCount
              type="modificado"
              count={counts.modificados}
              label="Servicios modificados"
            />
            <QuoteStatusCount
              type="rechazado"
              count={counts.rechazados}
              label="Servicios rechazados"
            />
          </div>
        )}

        <div className="border-t border-[#f0f0f0] pt-8 mb-8">
          <div className="flex justify-between items-center mb-5">
            <span className="text-[17px] font-bold text-[#1e1e1e]">Total anterior</span>
            <span className="text-[17px] font-bold text-[#575757] line-through decoration-[#575757]">
              ${resumen.total_anterior.toLocaleString()} MXN
            </span>
          </div>

          <div className="flex justify-between items-center mb-8">
            <span className="text-[18px] font-bold text-[#1e1e1e]">Nuevo total</span>
            <span className="text-[22px] font-extrabold text-[#f16c20]">
              ${resumen.total_nuevo.toLocaleString()} MXN
            </span>
          </div>

          {/* Difference Box */}
          {resumen.diferencia !== 0 && (
            <div className="bg-[#fff9f0] border border-[#ffe9cc] rounded-[12px] p-5 flex justify-between items-center">
              <span className="text-[15px] font-bold text-[#1e1e1e]">Diferencia</span>
              <span className="text-[15px] font-bold text-[#f16c20]">
                {resumen.diferencia > 0 ? "+" : ""} ${resumen.diferencia.toLocaleString()} MXN (
                {resumen.porcentaje})
              </span>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-[10px]">
            <p className="text-[13px] text-red-600 font-medium">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <button className="w-full h-[56px] bg-[#df2646] hover:bg-[#c41e3a] text-white font-bold rounded-[14px] transition-all shadow-[0_4px_15px_rgba(223,38,70,0.25)] flex items-center justify-center gap-2">
            {actionText}
          </button>

          <button
            onClick={handleDownload}
            disabled={isGenerating}
            className="w-full h-[56px] bg-white border-2 border-[#e8e8e8] text-[#575757] hover:border-[#df2646] hover:text-[#df2646] font-bold rounded-[14px] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <CircleNotch className="w-5 h-5 animate-spin" />
                Generando documento...
              </>
            ) : (
              <>
                <DownloadSimple className="w-5 h-5" />
                Descargar Orden de Trabajo
              </>
            )}
          </button>

          <button className="w-full h-[56px] bg-white border-2 border-[#e8e8e8] text-[#575757] hover:border-[#df2646] hover:text-[#df2646] font-bold rounded-[14px] transition-all">
            Solicitar aclaración
          </button>
        </div>
      </div>
    </div>
  );
}
