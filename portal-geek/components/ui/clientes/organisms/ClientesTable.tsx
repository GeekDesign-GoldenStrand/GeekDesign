"use client";

import type { Clientes } from "@prisma/client";

import { formatPhoneNumber } from "@/lib/utils/format";

import { CategoryDropdown, type ClientCategory } from "../molecules/CategoryDropdown";

interface ClientesTableProps {
  items: Clientes[];
  loading?: boolean;
  total?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onUpdateCategory?: (id: number, category: ClientCategory) => void;
}

export function ClientesTable({
  items,
  loading,
  total = 0,
  page = 1,
  pageSize = 10,
  onPageChange,
  onUpdateCategory,
}: ClientesTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e42200]"></div>
        <span className="ml-4 text-[#8e908f] font-medium font-ibm-plex">Cargando clientes...</span>
      </div>
    );
  }

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

  const totalPages = Math.ceil(total / pageSize);

  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== "...") {
        pages.push("...");
      }
    }
    return pages;
  };

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
          </div>
        ))}
      </div>

      {/* Contenedor de Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-center lg:justify-end mt-8 gap-2">
          <button
            onClick={() => onPageChange?.(page - 1)}
            disabled={page === 1}
            className="w-[36px] h-[36px] border border-[#d1d1d1] rounded-[4px] flex items-center justify-center text-[#1e1e1e] disabled:text-[#d1d1d1] hover:bg-gray-50 transition-colors text-[15px]"
          >
            {"<"}
          </button>
          {getPageNumbers().map((p, idx) => (
            <button
              key={idx}
              onClick={() => typeof p === "number" && onPageChange?.(p)}
              disabled={p === "..." || p === page}
              className={`w-[36px] h-[36px] rounded-[4px] font-bold text-[15px] font-ibm-plex transition-colors ${
                p === page
                  ? "bg-[#e42200] text-white"
                  : p === "..."
                    ? "text-[#d1d1d1] cursor-default"
                    : "bg-[#f0f0f0] text-[#1e1e1e] hover:bg-gray-200"
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => onPageChange?.(page + 1)}
            disabled={page === totalPages}
            className="w-[36px] h-[36px] border border-[#d1d1d1] rounded-[4px] flex items-center justify-center text-[#1e1e1e] disabled:text-[#d1d1d1] hover:bg-gray-50 transition-colors text-[15px]"
          >
            {">"}
          </button>
        </div>
      )}
    </div>
  );
}
