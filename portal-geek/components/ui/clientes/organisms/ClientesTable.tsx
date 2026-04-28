"use client";

import type { Clientes } from "@prisma/client";

import { PlusBoxIcon } from "@/components/ui/atoms/icons";

interface ClientesTableProps {
  items: Clientes[];
}

const CATEGORY_STYLES: Record<string, { color: string; bg: string }> = {
  Black: { color: "#ffffff", bg: "#000000" },
  Silver: { color: "#1e1e1e", bg: "#e0e0e0" },
  Gold: { color: "#1e1e1e", bg: "#f4d966" },
  Emprendedor: { color: "#1e1e1e", bg: "#acf466" },
  Baneado: { color: "#ffffff", bg: "#ff0000" },
};

function CategoryBadge({ category }: { category: string | null }) {
  if (!category) return null;
  const style = CATEGORY_STYLES[category] || { color: "#1e1e1e", bg: "#f0f0f0" };

  return (
    <span
      className="inline-flex items-center justify-center min-w-[105px] h-[32px] rounded-[16px] text-[12px] font-semibold font-ibm-plex transition-all shadow-[0_2px_4px_rgba(0,0,0,0.1)]"
      style={{
        color: style.color,
        backgroundColor: style.bg,
      }}
    >
      {category}
    </span>
  );
}

export function ClientesTable({ items }: ClientesTableProps) {
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
              {cliente.correo_electronico}
            </div>
            <div className="flex-1 font-medium text-[15px] text-[#1e1e1e] font-ibm-plex">
              {cliente.numero_telefono}
            </div>
            <div className="flex-1 flex justify-center">
              <CategoryBadge category={cliente.categoria} />
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
