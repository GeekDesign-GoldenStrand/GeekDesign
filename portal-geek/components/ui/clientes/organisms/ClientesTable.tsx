"use client";

import type { Clientes } from "@prisma/client";

import { PlusBoxIcon } from "@/components/ui/atoms/icons";

import { formatPhoneNumber } from "@/lib/utils/format";
import { CategoryDropdown, type ClientCategory } from "../molecules/CategoryDropdown";

interface ClientesTableProps {
  items: Clientes[];
  onUpdateCategory?: (id: number, category: ClientCategory) => void;
}

export function ClientesTable({ items, onUpdateCategory }: ClientesTableProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-white rounded-[15px] border border-dashed border-[#b9b8b8]">
        <h3 className="text-[20px] font-bold text-[#1e1e1e] font-ibm-plex">
          Sin clientes registrados
        </h3>
        <p className="text-[#8e908f] font-medium font-ibm-plex">
          No se encontraron clientes que coincidan con la búsqueda.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Table Header - Hidden on mobile */}
      <div className="hidden lg:flex items-center w-full h-[55px] bg-[#d1d1d1] rounded-[8px] px-6 mb-4">
        <div className="flex-1 font-bold text-[18px] text-black font-ibm-plex">Nombre</div>
        <div className="flex-1 font-bold text-[18px] text-black font-ibm-plex">Empresa</div>
        <div className="flex-1 font-bold text-[18px] text-black font-ibm-plex">RFC</div>
        <div className="flex-1 font-bold text-[18px] text-black font-ibm-plex">Correo</div>
        <div className="flex-1 font-bold text-[18px] text-black font-ibm-plex">Teléfono</div>
        <div className="flex-1 font-bold text-[18px] text-black text-center font-ibm-plex">
          Categoría
        </div>
        <div className="w-[60px]"></div>
      </div>

      {/* Table Rows / Cards */}
      <div className="flex flex-col gap-4">
        {items.map((cliente) => (
          <div
            key={cliente.id_cliente}
            className="flex flex-col lg:flex-row lg:items-center w-full min-h-[88px] bg-white rounded-[8px] p-6 lg:px-6 shadow-[0_4px_10px_rgba(0,0,0,0.1)] transition-shadow hover:shadow-[0_4px_15px_rgba(0,0,0,0.15)] gap-4 lg:gap-0"
          >
            {/* Nombre */}
            <div className="flex-1">
              <span className="lg:hidden block text-[14px] font-bold text-[#8e908f] uppercase mb-1">
                Nombre
              </span>
              <div className="font-semibold text-[18px] text-black font-ibm-plex">
                {cliente.nombre_cliente}
              </div>
            </div>

            {/* Empresa */}
            <div className="flex-1">
              <span className="lg:hidden block text-[14px] font-bold text-[#8e908f] uppercase mb-1">
                Empresa
              </span>
              <div className="font-medium text-[17px] text-[#1e1e1e] font-ibm-plex">
                {cliente.empresa || "—"}
              </div>
            </div>

            {/* RFC */}
            <div className="flex-1">
              <span className="lg:hidden block text-[14px] font-bold text-[#8e908f] uppercase mb-1">
                RFC
              </span>
              <div className="font-medium text-[16px] text-[#1e1e1e] font-mono">
                {cliente.rfc || "—"}
              </div>
            </div>

            {/* Correo */}
            <div className="flex-1">
              <span className="lg:hidden block text-[14px] font-bold text-[#8e908f] uppercase mb-1">
                Correo
              </span>
              <div className="font-medium text-[16px] text-[#1e1e1e] truncate pr-2 font-ibm-plex">
                <a
                  href={`mailto:${cliente.correo_electronico}`}
                  className="hover:text-[#e42200] hover:underline transition-all"
                >
                  {cliente.correo_electronico}
                </a>
              </div>
            </div>

            {/* Teléfono */}
            <div className="flex-1">
              <span className="lg:hidden block text-[14px] font-bold text-[#8e908f] uppercase mb-1">
                Teléfono
              </span>
              <div className="font-medium text-[17px] text-[#1e1e1e] font-ibm-plex">
                <a
                  href={`tel:${cliente.numero_telefono}`}
                  className="hover:text-[#e42200] hover:underline transition-all"
                >
                  {formatPhoneNumber(cliente.numero_telefono)}
                </a>
              </div>
            </div>

            {/* Categoría */}
            <div className="flex-1 flex lg:justify-center items-center">
              <div className="w-full lg:w-auto">
                <span className="lg:hidden block text-[14px] font-bold text-[#8e908f] uppercase mb-1">
                  Categoría
                </span>
                <CategoryDropdown
                  category={cliente.categoria}
                  onChange={(newCat) => onUpdateCategory?.(cliente.id_cliente, newCat)}
                />
              </div>
            </div>

            {/* Acción */}
            <div className="w-full lg:w-[60px] flex justify-end items-center border-t lg:border-none pt-4 lg:pt-0">
              <button
                className="flex items-center gap-2 lg:block text-black hover:text-[#e42200] transition-colors p-2"
                title="Ver más información"
              >
                <span className="lg:hidden font-semibold text-[14px]">Ver Detalles</span>
                <PlusBoxIcon size={24} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Contenedor de Paginación */}
      <div className="flex justify-center lg:justify-end mt-8 gap-2">
        <button className="w-[36px] h-[36px] border border-[#d1d1d1] rounded-[4px] flex items-center justify-center text-[#d1d1d1] hover:bg-gray-50 transition-colors text-[15px]">
          {"<"}
        </button>
        <button className="w-[36px] h-[36px] bg-[#e42200] text-white rounded-[4px] font-bold text-[15px] font-ibm-plex">
          1
        </button>
        <button className="w-[36px] h-[36px] bg-[#f0f0f0] text-[#1e1e1e] rounded-[4px] font-bold text-[15px] font-ibm-plex hover:bg-gray-200 transition-colors">
          2
        </button>
        <button className="w-[36px] h-[36px] bg-[#f0f0f0] text-[#d1d1d1] rounded-[4px] font-bold text-[15px] font-ibm-plex cursor-default">
          ...
        </button>
        <button className="w-[36px] h-[36px] border border-[#d1d1d1] rounded-[4px] flex items-center justify-center text-[#1e1e1e] hover:bg-gray-50 transition-colors text-[15px]">
          {">"}
        </button>
      </div>
    </div>
  );
}
