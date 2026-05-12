"use client";

import React, { useState } from "react";
import { 
  CheckCircle, 
  WarningCircle, 
  XCircle, 
  CaretDown, 
  ChatTeardropText 
} from "@phosphor-icons/react";

interface Servicio {
  id: number;
  nombre: string;
  descripcion: string;
  estado: string;
  precio_anterior: number;
  precio_nuevo: number | null;
  motivo: string | null;
  detalles_cliente: string;
  cambio?: string;
}

interface QuoteServicesTableProps {
  servicios: Servicio[];
  isRevision?: boolean;
}

export function QuoteServicesTable({ servicios, isRevision = false }: QuoteServicesTableProps) {
  const [expandedItems, setExpandedItems] = useState<number[]>([]); 

  const toggleExpand = (id: number) => {
    setExpandedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
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
                <tr className="hover:bg-[#fbfbfb] transition-colors align-top border-b-0">
                  <td className="px-6 py-5">
                    <p className="font-bold text-[#1e1e1e] text-[16px]">{servicio.nombre}</p>
                    <p className="text-[14px] text-[#575757]">{servicio.descripcion}</p>
                  </td>
                  {!isRevision && (
                    <td className="px-6 py-5">
                      <span className={`flex items-center gap-1.5 text-[13px] font-bold uppercase tracking-wider ${
                        servicio.estado === 'sin_cambios' ? 'text-green-600' : 
                        servicio.estado === 'modificado' ? 'text-orange-500' : 'text-red-500'
                      }`}>
                        {servicio.estado === 'sin_cambios' && <CheckCircle size={16} />}
                        {servicio.estado === 'modificado' && <WarningCircle size={16} />}
                        {servicio.estado === 'rechazado' && <XCircle size={16} />}
                        {servicio.estado.replace('_', ' ')}
                      </span>
                    </td>
                  )}
                  <td className="px-6 py-5 text-[15px] text-[#575757]">
                    ${servicio.precio_anterior.toLocaleString()} MXN
                  </td>
                  {!isRevision && (
                    <>
                      <td className="px-6 py-5 text-[15px] font-bold text-[#1e1e1e]">
                        {servicio.precio_nuevo ? `$${servicio.precio_nuevo.toLocaleString()} MXN` : '—'}
                      </td>
                      <td className="px-6 py-5">
                        <span className={`text-[14px] font-bold ${servicio.cambio ? 'text-orange-600' : 'text-[#8e908f]'}`}>
                          {servicio.cambio || '—'}
                        </span>
                      </td>
                    </>
                  )}
                  <td className="px-6 py-5 text-center">
                    <button 
                      onClick={() => toggleExpand(servicio.id)}
                      className={`p-2 rounded-full transition-all ${
                        expandedItems.includes(servicio.id) 
                          ? 'bg-[#df2646] text-white' 
                          : 'text-[#8e908f] hover:bg-gray-100'
                      }`}
                    >
                      <CaretDown size={20} className={`transition-transform duration-300 ${expandedItems.includes(servicio.id) ? 'rotate-180' : ''}`} />
                    </button>
                  </td>
                </tr>

                {/* Motivo de cambio - Siempre visible (excepto en revisión) */}
                {servicio.motivo && !isRevision && (
                  <tr className="border-t-0">
                    <td colSpan={6} className="px-6 pb-5 pt-0">
                      <div className={`p-4 rounded-[12px] text-[14px] leading-relaxed border flex items-center gap-3 ${
                        servicio.estado === 'modificado' 
                          ? 'bg-orange-50 text-orange-800 border-orange-100' 
                          : 'bg-red-50 text-red-800 border-red-100'
                      }`}>
                        <div className={`w-2 h-2 rounded-full shrink-0 ${servicio.estado === 'modificado' ? 'bg-orange-500' : 'bg-red-500'}`}></div>
                        <p>
                          <span className="font-bold">{servicio.estado === 'modificado' ? 'Nota sobre el cambio: ' : 'Motivo del rechazo: '}</span>
                          {servicio.motivo}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}

                {/* Detalles del servicio - Acordeón */}
                {expandedItems.includes(servicio.id) && (
                  <tr className="bg-[#f9f9f9]">
                    <td colSpan={6} className="px-6 py-8 border-l-[6px] border-[#df2646]">
                      <div className="max-w-[1000px] space-y-3">
                        <h4 className="text-[14px] font-bold text-[#1e1e1e] uppercase tracking-widest flex items-center gap-2">
                          <ChatTeardropText size={20} className="text-[#df2646]" />
                          Detalles del servicio
                        </h4>
                        <p className="text-[16px] text-[#575757] leading-relaxed italic bg-white p-5 rounded-[12px] border border-[#e8e8e8]">
                          "{servicio.detalles_cliente}"
                        </p>
                      </div>
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
          <div key={servicio.id} className="p-4 space-y-4">
            <div className="flex justify-between items-start gap-3">
              <div className="flex-1">
                <p className="font-bold text-[#1e1e1e] text-[16px]">{servicio.nombre}</p>
                <p className="text-[13px] text-[#575757]">{servicio.descripcion}</p>
              </div>
              <button 
                onClick={() => toggleExpand(servicio.id)}
                className={`p-2 rounded-full transition-all shrink-0 ${
                  expandedItems.includes(servicio.id) 
                    ? 'bg-[#df2646] text-white' 
                    : 'text-[#8e908f] bg-gray-50'
                }`}
              >
                <CaretDown size={18} className={`transition-transform duration-300 ${expandedItems.includes(servicio.id) ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {!isRevision && (
              <div className="flex flex-wrap items-center gap-3">
                <span className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${
                  servicio.estado === 'sin_cambios' ? 'text-green-600 bg-green-50 border-green-100' : 
                  servicio.estado === 'modificado' ? 'text-orange-600 bg-orange-50 border-orange-100' : 'text-red-600 bg-red-50 border-red-100'
                }`}>
                  {servicio.estado.replace('_', ' ')}
                </span>
                {servicio.cambio && (
                  <span className="text-[11px] font-bold text-orange-600 bg-orange-50 border border-orange-100 px-2 py-1 rounded-full">
                    {servicio.cambio}
                  </span>
                )}
              </div>
            )}

            <div className={`grid ${isRevision ? 'grid-cols-1' : 'grid-cols-2'} gap-4 pt-2`}>
              <div>
                <p className="text-[11px] text-[#8e908f] uppercase font-bold mb-1">{isRevision ? "Precio solicitado" : "Precio anterior"}</p>
                <p className={`text-[14px] ${isRevision ? 'text-[#1e1e1e] font-bold' : 'text-[#575757] line-through decoration-[#df2646] opacity-60'}`}>
                  ${servicio.precio_anterior.toLocaleString()}
                </p>
              </div>
              {!isRevision && (
                <div>
                  <p className="text-[11px] text-[#8e908f] uppercase font-bold mb-1">Nuevo precio</p>
                  <p className="text-[15px] font-bold text-[#1e1e1e]">
                    {servicio.precio_nuevo ? `$${servicio.precio_nuevo.toLocaleString()}` : '—'}
                  </p>
                </div>
              )}
            </div>

            {/* Motivo siempre visible (excepto revisión) */}
            {servicio.motivo && !isRevision && (
              <div className={`p-3 rounded-[10px] text-[13px] border flex items-start gap-2 ${
                servicio.estado === 'modificado' ? 'bg-orange-50 border-orange-100 text-orange-900' : 'bg-red-50 border-red-100 text-red-900'
              }`}>
                <WarningCircle size={18} className="shrink-0 mt-0.5" />
                <p>{servicio.motivo}</p>
              </div>
            )}

            {/* Acordeón detalles en móvil */}
            {expandedItems.includes(servicio.id) && (
              <div className="bg-[#f9f9f9] p-4 rounded-[12px] border-l-[4px] border-[#df2646] mt-2">
                <h4 className="text-[12px] font-bold text-[#1e1e1e] uppercase tracking-widest mb-2 flex items-center gap-2">
                  <ChatTeardropText size={16} className="text-[#df2646]" />
                  Detalles del servicio
                </h4>
                <p className="text-[14px] text-[#575757] italic bg-white p-3 rounded-[8px] border border-[#e8e8e8]">
                  "{servicio.detalles_cliente}"
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
