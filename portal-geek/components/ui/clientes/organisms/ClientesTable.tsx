"use client";

import type { Clientes } from "@prisma/client";

import { PlusBoxIcon } from "@/components/ui/atoms/icons";

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
      {/* Table Header Container */}
      <div className="flex items-center w-full h-[55px] bg-[#d1d1d1] rounded-[8px] px-6 mb-4">
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

      {/* Table Rows */}
      <div className="flex flex-col gap-4">
        {items.map((cliente) => (
          <div
            key={cliente.id_cliente}
            className="flex items-center w-full h-[88px] bg-white rounded-[8px] px-6 shadow-[0_4px_10px_rgba(0,0,0,0.1)] transition-shadow hover:shadow-[0_4px_15px_rgba(0,0,0,0.15)]"
          >
            <div className="flex-1 font-semibold text-[16px] text-black font-ibm-plex">
              {cliente.nombre_cliente}
            </div>
            <div className="flex-1 font-medium text-[15px] text-[#1e1e1e] font-ibm-plex">
              {cliente.empresa || "—"}
            </div>
            <div className="flex-1 font-medium text-[14px] text-[#1e1e1e] font-mono">
              {cliente.rfc || "—"}
            </div>
            <div className="flex-1 font-medium text-[14px] text-[#1e1e1e] truncate pr-2 font-ibm-plex">
              <a
                href={`mailto:${cliente.correo_electronico}`}
                className="hover:text-[#e42200] hover:underline transition-all"
              >
                {cliente.correo_electronico}
              </a>
            </div>
            <div className="flex-1 font-medium text-[15px] text-[#1e1e1e] font-ibm-plex">
              <a
                href={`tel:${cliente.numero_telefono}`}
                className="hover:text-[#e42200] hover:underline transition-all"
              >
                {cliente.numero_telefono}
              </a>
            </div>
            <div className="flex-1 flex justify-center">
              <CategoryDropdown
                category={cliente.categoria}
                onChange={(newCat) => onUpdateCategory?.(cliente.id_cliente, newCat)}
              />
            </div>
            <div className="w-[60px] flex justify-end">
              <button
                className="text-black hover:text-[#e42200] transition-colors p-2"
                title="Ver más información"
              >
                <PlusBoxIcon size={24} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Container */}
      <div className="flex justify-end mt-8 gap-2">
        <button className="w-[32px] h-[32px] border border-[#d1d1d1] rounded-[4px] flex items-center justify-center text-[#d1d1d1] hover:bg-gray-50 transition-colors">
          {"<"}
        </button>
        <button className="w-[32px] h-[32px] bg-[#e42200] text-white rounded-[4px] font-bold text-[14px] font-ibm-plex">
          1
        </button>
        <button className="w-[32px] h-[32px] bg-[#f0f0f0] text-[#1e1e1e] rounded-[4px] font-bold text-[14px] font-ibm-plex hover:bg-gray-200 transition-colors">
          2
        </button>
        <button className="w-[32px] h-[32px] bg-[#f0f0f0] text-[#d1d1d1] rounded-[4px] font-bold text-[14px] font-ibm-plex cursor-default">
          ...
        </button>
        <button className="w-[32px] h-[32px] border border-[#d1d1d1] rounded-[4px] flex items-center justify-center text-[#1e1e1e] hover:bg-gray-50 transition-colors">
          {">"}
        </button>
      </div>
    </div>
  );
}
