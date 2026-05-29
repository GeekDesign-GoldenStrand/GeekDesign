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

// Mirror CotizacionesTable sizing — same px-4 py-2/py-3, text-sm, space-y-2.
// Single source of truth so every admin table reads at the same visual weight.
const GRID_TEMPLATE = "1fr 1fr 1fr 1fr 1fr 1fr";

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
      <div className="space-y-4 md:space-y-2">
        {/* Header - Desktop Only */}
        <div
          className="hidden md:grid px-4 py-2 rounded bg-[#c6c6c6] text-[#1e1e1e] font-bold text-sm text-center"
          style={{ gridTemplateColumns: GRID_TEMPLATE }}
        >
          <span className="whitespace-nowrap">Nombre</span>
          <span className="whitespace-nowrap">Empresa</span>
          <span className="whitespace-nowrap">RFC</span>
          <span className="whitespace-nowrap">Correo</span>
          <span className="whitespace-nowrap">Teléfono</span>
          <span className="whitespace-nowrap">Categoría</span>
        </div>

        {/* Rows */}
        {items.map((cliente) => (
          <div key={cliente.id_cliente}>
            {/* Desktop Row */}
            <div
              className="hidden md:grid px-4 py-3 bg-white text-[#1e1e1e] rounded shadow text-sm items-center text-center transition-shadow hover:shadow-md"
              style={{ gridTemplateColumns: GRID_TEMPLATE }}
            >
              <span className="truncate px-2 min-w-0" title={cliente.nombre_cliente}>
                {cliente.nombre_cliente}
              </span>
              <span className="truncate px-2 min-w-0" title={cliente.empresa || undefined}>
                {cliente.empresa || "—"}
              </span>
              <span className="truncate px-2 min-w-0 font-mono" title={cliente.rfc || undefined}>
                {cliente.rfc || "—"}
              </span>
              <span className="truncate px-2 min-w-0">
                <a
                  href={`mailto:${cliente.correo_electronico}`}
                  className="hover:text-[#e42200] hover:underline transition-all"
                  title={cliente.correo_electronico}
                >
                  {cliente.correo_electronico}
                </a>
              </span>
              <span className="truncate px-2 min-w-0">
                <a
                  href={`tel:${cliente.numero_telefono}`}
                  className="hover:text-[#e42200] hover:underline transition-all"
                >
                  {formatPhoneNumber(cliente.numero_telefono)}
                </a>
              </span>
              <div className="flex justify-center">
                <CategoryDropdown
                  category={cliente.categoria}
                  onChange={(newCat) => onUpdateCategory?.(cliente.id_cliente, newCat)}
                />
              </div>
            </div>

            {/* Mobile Card */}
            <div className="md:hidden bg-white p-5 rounded-xl shadow-sm border border-[#F0F0F0] space-y-3">
              <div className="flex justify-between items-start gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-[#8e908f] uppercase tracking-[1px] mb-1">
                    Nombre
                  </p>
                  <p
                    className="text-[15px] font-semibold text-[#1e1e1e] truncate"
                    title={cliente.nombre_cliente}
                  >
                    {cliente.nombre_cliente}
                  </p>
                </div>
                <CategoryDropdown
                  category={cliente.categoria}
                  onChange={(newCat) => onUpdateCategory?.(cliente.id_cliente, newCat)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#F5F5F5]">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-[#8e908f] uppercase tracking-[1px] mb-0.5">
                    Empresa
                  </p>
                  <p
                    className="text-[12px] text-[#1e1e1e] truncate"
                    title={cliente.empresa || undefined}
                  >
                    {cliente.empresa || "—"}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-[#8e908f] uppercase tracking-[1px] mb-0.5">
                    RFC
                  </p>
                  <p
                    className="text-[12px] text-[#1e1e1e] truncate font-mono"
                    title={cliente.rfc || undefined}
                  >
                    {cliente.rfc || "—"}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-[#8e908f] uppercase tracking-[1px] mb-0.5">
                    Correo
                  </p>
                  <a
                    href={`mailto:${cliente.correo_electronico}`}
                    className="text-[12px] text-[#1e1e1e] truncate hover:text-[#e42200] hover:underline block"
                    title={cliente.correo_electronico}
                  >
                    {cliente.correo_electronico}
                  </a>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-[#8e908f] uppercase tracking-[1px] mb-0.5">
                    Teléfono
                  </p>
                  <a
                    href={`tel:${cliente.numero_telefono}`}
                    className="text-[12px] text-[#1e1e1e] truncate hover:text-[#e42200] hover:underline block"
                  >
                    {formatPhoneNumber(cliente.numero_telefono)}
                  </a>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center lg:justify-end mt-6 gap-2">
          <button
            onClick={() => onPageChange?.(page - 1)}
            disabled={page === 1}
            className="w-[32px] h-[32px] border border-[#d1d1d1] rounded-[4px] flex items-center justify-center text-[#1e1e1e] disabled:text-[#d1d1d1] hover:bg-gray-50 transition-colors text-[14px]"
          >
            {"<"}
          </button>
          {getPageNumbers().map((p, idx) => (
            <button
              key={idx}
              onClick={() => typeof p === "number" && onPageChange?.(p)}
              disabled={p === "..." || p === page}
              className={`w-[32px] h-[32px] rounded-[4px] font-bold text-[14px] font-ibm-plex transition-colors ${
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
            className="w-[32px] h-[32px] border border-[#d1d1d1] rounded-[4px] flex items-center justify-center text-[#1e1e1e] disabled:text-[#d1d1d1] hover:bg-gray-50 transition-colors text-[14px]"
          >
            {">"}
          </button>
        </div>
      )}
    </div>
  );
}
