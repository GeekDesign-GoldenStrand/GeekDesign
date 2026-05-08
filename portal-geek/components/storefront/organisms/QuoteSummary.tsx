"use client";

import { CheckCircle, WarningCircle, XCircle } from "@phosphor-icons/react";

interface Resumen {
  total_anterior: number;
  total_nuevo: number;
  diferencia: number;
  porcentaje: string;
}

interface QuoteSummaryProps {
  resumen: Resumen;
  counts: {
    aprobados: number;
    modificados: number;
    rechazados: number;
  };
  actionText: string;
}

export function QuoteSummary({ resumen, counts, actionText }: QuoteSummaryProps) {
  return (
    <div className="lg:col-span-1">
      <div className="bg-white rounded-[16px] border border-[#e8e8e8] p-5 md:p-8 sticky top-8 shadow-sm">
        <h3 className="text-[18px] md:text-[20px] font-bold text-[#1e1e1e] mb-6">Resumen de la cotización</h3>
        
        {/* Status Counts Section */}
        <div className="space-y-5 mb-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <CheckCircle size={24} weight="bold" className="text-green-600" />
              <span className="text-[15px] font-medium text-[#575757]">Servicios aprobados</span>
            </div>
            <span className="text-[18px] font-bold text-green-600">{counts.aprobados}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <WarningCircle size={24} weight="bold" className="text-orange-500" />
              <span className="text-[15px] font-medium text-[#575757]">Servicios modificados</span>
            </div>
            <span className="text-[18px] font-bold text-orange-500">{counts.modificados}</span>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <XCircle size={24} weight="bold" className="text-red-500" />
              <span className="text-[15px] font-medium text-[#575757]">Servicios rechazados</span>
            </div>
            <span className="text-[18px] font-bold text-red-500">{counts.rechazados}</span>
          </div>
        </div>

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
          <div className="bg-[#fff9f0] border border-[#ffe9cc] rounded-[12px] p-5 flex justify-between items-center">
            <span className="text-[15px] font-bold text-[#1e1e1e]">Diferencia</span>
            <span className="text-[15px] font-bold text-[#f16c20]">
              + ${resumen.diferencia.toLocaleString()} MXN ({resumen.porcentaje})
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <button className="w-full h-[56px] bg-[#df2646] hover:bg-[#c41e3a] text-white font-bold rounded-[14px] transition-all shadow-[0_4px_15px_rgba(223,38,70,0.25)]">
            {actionText}
          </button>
          <button className="w-full h-[56px] bg-white border-2 border-[#e8e8e8] text-[#575757] hover:border-[#df2646] hover:text-[#df2646] font-bold rounded-[14px] transition-all">
            Solicitar aclaración
          </button>
        </div>
      </div>
    </div>
  );
}
