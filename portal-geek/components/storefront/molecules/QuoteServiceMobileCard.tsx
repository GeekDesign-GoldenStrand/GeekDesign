"use client";

import { WarningCircle, CaretDown } from "@phosphor-icons/react";
import React from "react";

import type { QuotationItem } from "@/types";

interface QuoteServiceMobileCardProps {
  servicio: QuotationItem;
  isRevision: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function QuoteServiceMobileCard({
  servicio,
  isRevision,
  isExpanded,
  onToggleExpand,
}: QuoteServiceMobileCardProps) {
  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1">
          <p className="font-bold text-[#1e1e1e] text-[16px]">{servicio.nombre}</p>
          <p className="text-[13px] text-[#575757]">{servicio.descripcion}</p>
        </div>
        <button
          onClick={onToggleExpand}
          className={`p-2 rounded-full transition-all shrink-0 ${
            isExpanded ? "bg-[#df2646] text-white" : "text-[#8e908f] bg-gray-50"
          }`}
        >
          <CaretDown
            size={18}
            className={`transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {!isRevision && (
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${
              servicio.estado === "sin_cambios"
                ? "text-green-600 bg-green-50 border-green-100"
                : servicio.estado === "modificado"
                  ? "text-orange-600 bg-orange-50 border-orange-100"
                  : "text-red-600 bg-red-50 border-red-100"
            }`}
          >
            {servicio.estado.replace("_", " ")}
          </span>
          {servicio.cambio && (
            <span className="text-[11px] font-bold text-orange-600 bg-orange-50 border border-orange-100 px-2 py-1 rounded-full">
              {servicio.cambio}
            </span>
          )}
        </div>
      )}

      <div className={`grid ${isRevision ? "grid-cols-1" : "grid-cols-2"} gap-4 pt-2`}>
        <div>
          <p className="text-[11px] text-[#8e908f] uppercase font-bold mb-1">
            {isRevision ? "Precio solicitado" : "Precio anterior"}
          </p>
          <p
            className={`text-[14px] ${isRevision ? "text-[#1e1e1e] font-bold" : "text-[#575757] line-through decoration-[#df2646] opacity-60"}`}
          >
            ${servicio.precio_anterior.toLocaleString()}
          </p>
        </div>
        {!isRevision && (
          <div>
            <p className="text-[11px] text-[#8e908f] uppercase font-bold mb-1">Nuevo precio</p>
            <p className="text-[15px] font-bold text-[#1e1e1e]">
              {servicio.precio_nuevo ? `$${servicio.precio_nuevo.toLocaleString()}` : "—"}
            </p>
          </div>
        )}
      </div>

      {servicio.motivo && !isRevision && (
        <div
          className={`p-3 rounded-[10px] text-[13px] border flex items-start gap-2 ${
            servicio.estado === "modificado"
              ? "bg-orange-50 border-orange-100 text-orange-900"
              : "bg-red-50 border-red-100 text-red-900"
          }`}
        >
          <WarningCircle size={18} className="shrink-0 mt-0.5" />
          <p>{servicio.motivo}</p>
        </div>
      )}
    </div>
  );
}
