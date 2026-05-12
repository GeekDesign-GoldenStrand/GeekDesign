"use client";

import { CheckCircle, WarningCircle, XCircle, CaretDown } from "@phosphor-icons/react";
import React from "react";

import type { QuotationItem } from "@/types";

interface QuoteServiceTableRowProps {
  servicio: QuotationItem;
  isRevision: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function QuoteServiceTableRow({
  servicio,
  isRevision,
  isExpanded,
  onToggleExpand,
}: QuoteServiceTableRowProps) {
  return (
    <tr className="hover:bg-[#fbfbfb] transition-colors align-top border-b-0">
      <td className="px-6 py-5">
        <p className="font-bold text-[#1e1e1e] text-[16px]">{servicio.nombre}</p>
        <p className="text-[14px] text-[#575757]">{servicio.descripcion}</p>
      </td>

      {!isRevision && (
        <td className="px-6 py-5">
          <span
            className={`flex items-center gap-1.5 text-[13px] font-bold uppercase tracking-wider ${
              servicio.estado === "sin_cambios"
                ? "text-green-600"
                : servicio.estado === "modificado"
                  ? "text-orange-500"
                  : "text-red-500"
            }`}
          >
            {servicio.estado === "sin_cambios" && <CheckCircle size={16} />}
            {servicio.estado === "modificado" && <WarningCircle size={16} />}
            {servicio.estado === "rechazado" && <XCircle size={16} />}
            {servicio.estado.replace("_", " ")}
          </span>
        </td>
      )}

      <td className="px-6 py-5 text-[15px] text-[#575757]">
        ${servicio.precio_anterior.toLocaleString()} MXN
      </td>

      {!isRevision && (
        <>
          <td className="px-6 py-5 text-[15px] font-bold text-[#1e1e1e]">
            {servicio.precio_nuevo ? `$${servicio.precio_nuevo.toLocaleString()} MXN` : "—"}
          </td>
          <td className="px-6 py-5">
            <span
              className={`text-[14px] font-bold ${servicio.cambio ? "text-orange-600" : "text-[#8e908f]"}`}
            >
              {servicio.cambio || "—"}
            </span>
          </td>
        </>
      )}

      <td className="px-6 py-5 text-center">
        <button
          onClick={onToggleExpand}
          className={`p-2 rounded-full transition-all ${
            isExpanded ? "bg-[#df2646] text-white" : "text-[#8e908f] hover:bg-gray-100"
          }`}
        >
          <CaretDown
            size={20}
            className={`transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
          />
        </button>
      </td>
    </tr>
  );
}
