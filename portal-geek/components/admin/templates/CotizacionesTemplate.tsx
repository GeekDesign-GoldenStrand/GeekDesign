"use client";

import { useState, useRef, useEffect } from "react";

import { AdminToolbar } from "@/components/admin/molecules/AdminToolbar";
import { AdminHeader } from "@/components/admin/organisms/AdminHeader";
import { CotizacionesTable } from "@/components/admin/organisms/CotizacionesTable";

// Frontend type for a quotation entry
type Cotizacion = {
  id_cotizacion: number;
  fecha_creacion: string;
  monto_total: number;
  empresa: string | null;
  cliente: string;
  estatus: string;
  fecha_estimada: string | null;
};

// Props define the data and callbacks passed into the template
type CotizacionesTemplateProps = {
  cotizaciones: Cotizacion[]; // list of quotations to display
  search: string; // current search value
  setSearch: (value: string) => void; // callback to update search
  onDelete: (id: number) => void; // callback to delete a quotation
  onStatusChange: (id: number, status: string) => void; // callback to update status
  page: number; // current page number
  setPage: (page: number) => void; // callback to update page
  total: number; // total number of quotations

  filterCliente: string; // filter by client name
  setFilterCliente: (value: string) => void;
  filterEmpresa: string; // filter by company name
  setFilterEmpresa: (value: string) => void;
  filterEstatus: string[]; // filter by status values
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

  // State for showing/hiding the filter dropdown
  const [showFilter, setShowFilter] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

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
      {/* Page header */}
      <AdminHeader title="Cotizaciones" />

      <section className="max-w-[1350px] mx-auto pt-5 space-y-4">
        {/* Toolbar with search, add, and filter actions */}
        <div className="relative">
          <AdminToolbar
            search={search}
            onSearchChange={setSearch}
            onAgregar={() => {
              // Placeholder for "add quotation" logic
              // Left empty to avoid console.log warnings
            }}
            onFiltrar={() => setShowFilter((prev) => !prev)}
          />

          {/* Filter dropdown (visible when showFilter is true) */}
          {showFilter && (
            <div ref={filterRef} className="absolute right-0 mt-2 z-50">
              <div className="bg-white p-6 rounded-[14px] w-[21rem] shadow-[0_8px_30px_rgba(0,0,0,0.18)] border-4 border-[#ff7f7f] text-black">
                <h2 className="text-[24px] font-semibold mb-4 text-[#1e1e1e]">Filtros</h2>

                {/* Client filter */}
                <div className="mb-3">
                  <p className="text-[13px] font-semibold text-[#575757] mb-1">Cliente</p>
                  <input
                    value={filterCliente}
                    onChange={(e) => setFilterCliente(e.target.value)}
                    className="w-full border border-[#b9b8b8] rounded-[6px] p-2"
                  />
                </div>

                {/* Company filter */}
                <div className="mb-3">
                  <p className="text-[13px] font-semibold text-[#575757] mb-1">Empresa</p>
                  <input
                    value={filterEmpresa}
                    onChange={(e) => setFilterEmpresa(e.target.value)}
                    className="w-full border border-[#b9b8b8] rounded-[6px] p-2"
                  />
                </div>

                {/* Status filter (multi-select checkboxes) */}
                <div className="mb-3">
                  <p className="text-[13px] font-semibold text-[#575757] mb-2">Estatus</p>
                  <div className="space-y-2">
                    {["Validada", "Aprobada", "Rechazada", "En_revision"].map((status) => (
                      <label key={status} className="flex items-center gap-2 text-[13px]">
                        <input
                          type="checkbox"
                          checked={filterEstatus.includes(status)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilterEstatus([...filterEstatus, status]);
                            } else {
                              setFilterEstatus(filterEstatus.filter((s) => s !== status));
                            }
                          }}
                          className="accent-[#ff7f7f]"
                        />
                        {status}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Filter action buttons */}
                <div className="mt-4 flex justify-center gap-3">
                  <button
                    onClick={() => {
                      setFilterCliente("");
                      setFilterEmpresa("");
                      setFilterEstatus([]);
                    }}
                    className="h-7 px-3 rounded-[6px] bg-[#ff7f7f] text-white text-[12px] font-semibold hover:bg-[#f36a6a]"
                  >
                    Reset
                  </button>

                  <button
                    onClick={() => setShowFilter(false)}
                    className="h-7 px-6 rounded-[6px] bg-[#ff7f7f] text-white text-[12px] font-semibold hover:bg-[#f36a6a]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quotations table */}
        <CotizacionesTable
          cotizaciones={cotizaciones}
          onDelete={onDelete}
          onStatusChange={onStatusChange}
        />

        {/* Pagination controls */}
        <div className="flex items-center justify-center gap-4 mt-8 mb-6">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-4 py-2 text-[14px] font-medium text-[#575757] 
                        border border-[#b9b8b8] rounded-[7px] 
                        hover:bg-[#f5f5f5] disabled:opacity-40"
          >
            ← Previous
          </button>

          <span className="text-[14px] text-[#575757]">
            Page {page} of {Math.ceil(total / pageSize)}
          </span>

          <button
            disabled={page === Math.ceil(total / pageSize)}
            onClick={() => setPage(page + 1)}
            className="px-4 py-2 text-[14px] font-medium text-[#575757] 
                        border border-[#b9b8b8] rounded-[7px] 
                        hover:bg-[#f5f5f5] disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      </section>
    </>
  );
}
