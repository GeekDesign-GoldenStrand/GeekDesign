"use client";

import React, { useState } from "react";

import type { QuotationItem } from "@/types";

import { QuoteServiceDetails } from "../molecules/QuoteServiceDetails";
import { QuoteServiceMobileCard } from "../molecules/QuoteServiceMobileCard";
import { QuoteServiceTableRow } from "../molecules/QuoteServiceTableRow";

interface QuoteServicesTableProps {
  servicios: QuotationItem[];
  isRevision?: boolean;
}

export function QuoteServicesTable({ servicios, isRevision = false }: QuoteServicesTableProps) {
  const [expandedItems, setExpandedItems] = useState<number[]>([]);

  const toggleExpand = (id: number) => {
    setExpandedItems((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  return (
    <div className="bg-white rounded-[16px] border border-[#e8e8e8] shadow-sm overflow-hidden">
      <div className="px-4 py-4 md:px-6 border-b border-[#e8e8e8] bg-[#fcfcfc]">
        <h3 className="text-[18px] font-bold text-[#1e1e1e]">Servicios incluidos</h3>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-[#f9f9f9] text-[13px] text-[#8e908f] uppercase font-bold">
            <tr>
              <th className="px-6 py-3">Servicio</th>
              {!isRevision && <th className="px-6 py-3">Estado</th>}
              <th className="px-6 py-3">{isRevision ? "Precio solicitado" : "Antes"}</th>
              {!isRevision && <th className="px-6 py-3">Nuevo precio</th>}
              {!isRevision && <th className="px-6 py-3">Cambio</th>}
              <th className="px-6 py-3 text-center">Ver detalles</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e8e8e8]">
            {servicios.map((servicio) => (
              <React.Fragment key={servicio.id}>
                <QuoteServiceTableRow
                  servicio={servicio}
                  isRevision={isRevision}
                  isExpanded={expandedItems.includes(servicio.id)}
                  onToggleExpand={() => toggleExpand(servicio.id)}
                />

                {/* Motivo de cambio - Siempre visible (excepto en revisión) */}
                {servicio.motivo && !isRevision && (
                  <tr className="border-t-0">
                    <td colSpan={6} className="px-6 pb-5 pt-0">
                      <div
                        className={`p-4 rounded-[12px] text-[14px] leading-relaxed border flex items-center gap-3 ${
                          servicio.estado === "modificado"
                            ? "bg-orange-50 text-orange-800 border-orange-100"
                            : "bg-red-50 text-red-800 border-red-100"
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full shrink-0 ${servicio.estado === "modificado" ? "bg-orange-500" : "bg-red-500"}`}
                        ></div>
                        <p>
                          <span className="font-bold">
                            {servicio.estado === "modificado"
                              ? "Nota sobre el cambio: "
                              : "Motivo del rechazo: "}
                          </span>
                          {servicio.motivo}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}

                {/* Detalles del servicio - Acordeón */}
                {expandedItems.includes(servicio.id) && (
                  <tr className="bg-[#f9f9f9]">
                    <td colSpan={6} className="p-0 border-0">
                      <QuoteServiceDetails detalles={servicio.detalles_cliente} />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-[#e8e8e8]">
        {servicios.map((servicio) => (
          <React.Fragment key={servicio.id}>
            <QuoteServiceMobileCard
              servicio={servicio}
              isRevision={isRevision}
              isExpanded={expandedItems.includes(servicio.id)}
              onToggleExpand={() => toggleExpand(servicio.id)}
            />

            {expandedItems.includes(servicio.id) && (
              <div className="px-4 pb-4">
                <QuoteServiceDetails detalles={servicio.detalles_cliente} isMobile />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
