"use client";

import { useState, useRef, useEffect } from "react";

import { AdminToolbar } from "@/components/admin/molecules/AdminToolbar";
import { AdminHeader } from "@/components/admin/organisms/AdminHeader";
import { CotizacionesTable } from "@/components/admin/organisms/CotizacionesTable";

// Frontend type
type Cotizacion = {
  id_cotizacion: number;
  fecha_creacion: string;
  monto_total: number;
  empresa: string | null;
  cliente: string;
  estatus: string;
  fecha_estimada: string | null;
};

// Component props
type CotizacionesTemplateProps = {
  cotizaciones: Cotizacion[];
  search: string;
  setSearch: (value: string) => void;
  onDelete: (id: number) => void;
  onStatusChange: (id: number, status: string) => void;
  page: number;
  setPage: (page: number) => void;
  total: number;

  filterCliente: string;
  setFilterCliente: (value: string) => void;
  filterEmpresa: string;
  setFilterEmpresa: (value: string) => void;
  filterEstatus: string[];
  setFilterEstatus: (value: string[]) => void;
};

export function CotizacionesTemplate({
  cotizaciones,
  search,
  setSearch,
  onDelete,
  onStatusChange,
  page,
  setPage,
  total,
  filterCliente,
  setFilterCliente,
  filterEmpresa,
  setFilterEmpresa,
  filterEstatus,
  setFilterEstatus,
}: CotizacionesTemplateProps) {
  const pageSize = 13;

  const [showFilter, setShowFilter] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Mapping between UI labels and API values
  const STATUS_OPTIONS = [
    { label: "Validada", value: "Validada" },
    { label: "Aprobada", value: "Aprobada" },
    { label: "Rechazada", value: "Rechazada" },
    { label: "En revisión", value: "En_revision" },
  ];

  // Close filter dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilter(false);
      }
    }

    if (showFilter) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showFilter]);

  return (
    <>
      <AdminHeader title="Cotizaciones" />

      <section className="max-w-[1350px] mx-auto px-6 pt-5 space-y-4">
        {/* Toolbar section */}
        <div className="relative">
          <AdminToolbar
            search={search}
            onSearchChange={setSearch}
            onAgregar={() => {}}
            onFiltrar={() => setShowFilter((prev) => !prev)}
          />

          {/* Filter dropdown */}
          {showFilter && (
            <div ref={filterRef} className="absolute right-0 mt-2 z-50">
              <div className="bg-white p-6 rounded-[14px] w-[21rem] shadow-[0_8px_30px_rgba(0,0,0,0.18)] border-2 border-rose-200 text-black">
                <h2 className="text-[24px] font-semibold mb-4 text-[#1e1e1e]">
                  Filtros
                </h2>

                {/* Client filter */}
                <div className="mb-3">
                  <p className="text-[13px] font-semibold text-[#575757] mb-1">
                    Cliente
                  </p>
                  <input
                    value={filterCliente}
                    onChange={(e) => setFilterCliente(e.target.value)}
                    className="w-full border border-rose-200 bg-rose-50 rounded-[6px] p-2 focus:outline-none focus:ring-2 focus:ring-rose-300 transition"
                  />
                </div>

                {/* Company filter */}
                <div className="mb-3">
                  <p className="text-[13px] font-semibold text-[#575757] mb-1">
                    Empresa
                  </p>
                  <input
                    value={filterEmpresa}
                    onChange={(e) => setFilterEmpresa(e.target.value)}
                    className="w-full border border-rose-200 bg-rose-50 rounded-[6px] p-2 focus:outline-none focus:ring-2 focus:ring-rose-300 transition"
                  />
                </div>

                {/* Status filter */}
                <div className="mb-3">
                  <p className="text-[13px] font-semibold text-[#575757] mb-2">
                    Estatus
                  </p>
                  <div className="space-y-2">
                    {STATUS_OPTIONS.map((status) => (
                      <label
                        key={status.value}
                        className="flex items-center gap-2 text-[13px]"
                      >
                        <input
                          type="checkbox"
                          checked={filterEstatus.includes(status.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilterEstatus([...filterEstatus, status.value]);
                            } else {
                              setFilterEstatus(
                                filterEstatus.filter((s) => s !== status.value)
                              );
                            }
                          }}
                          className="accent-rose-400"
                        />
                        {status.label}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Filter actions */}
                <div className="mt-4 flex justify-center gap-3">
                  <button
                    onClick={() => {
                      setFilterCliente("");
                      setFilterEmpresa("");
                      setFilterEstatus([]);
                    }}
                    className="h-8 px-4 rounded-[6px] bg-rose-200 text-rose-800 text-[13px] font-semibold hover:bg-rose-300 transition"
                  >
                    Reset
                  </button>

                  <button
                    onClick={() => setShowFilter(false)}
                    className="h-8 px-6 rounded-[6px] bg-rose-300 text-white text-[13px] font-semibold hover:bg-rose-400 transition"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Table section */}
        <CotizacionesTable
          cotizaciones={cotizaciones}
          onDelete={onDelete}
          onStatusChange={onStatusChange}
        />

        {/* Pagination (Figma-style) */}
        <div className="flex justify-end mt-8 mb-6 pr-4">
          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="w-[36px] h-[36px] border border-gray-300 rounded-[4px] flex items-center justify-center text-[#1e1e1e] hover:bg-gray-50 disabled:opacity-40"
            >
              {"<"}
            </button>

            {Array.from({ length: Math.ceil(total / pageSize) }, (_, i) => {
              const pageNumber = i + 1;
              const isActive = pageNumber === page;

              return (
                <button
                  key={pageNumber}
                  onClick={() => setPage(pageNumber)}
                  className={`w-[36px] h-[36px] rounded-[4px] font-bold text-[15px]
                  ${
                    isActive
                      ? "bg-[#e42200] text-white"
                      : "bg-gray-100 text-[#1e1e1e] hover:bg-gray-200"
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}

            <button
              disabled={page === Math.ceil(total / pageSize)}
              onClick={() => setPage(page + 1)}
              className="w-[36px] h-[36px] border border-gray-300 rounded-[4px] flex items-center justify-center text-[#1e1e1e] hover:bg-gray-50 disabled:opacity-40"
            >
              {">"}
            </button>
          </div>
        </div>
      </section>
    </>
  );
}