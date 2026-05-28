"use client";

import Link from "next/link";
import { useState } from "react";

import { AdminToolbar } from "@/components/admin/molecules/AdminToolbar";
import { AdminHeader } from "@/components/admin/organisms/AdminHeader";
import { CotizacionesFilterSidebar } from "@/components/admin/organisms/CotizacionesFilterSidebar";
import { CotizacionesTable } from "@/components/admin/organisms/CotizacionesTable";

export type Cotizacion = {
  id_cotizacion: number;
  fecha_creacion: string;
  monto_total: number;
  empresa: string | null;
  cliente: string;
  folio: string | null;
  nombre_oportunidad: string | null;
  estatus: string;
  fecha_estimada: string | null;
  archivos: { id: number; nombre: string }[];
};

type ClienteOption = { id: number; nombre: string };

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

  clientes: ClienteOption[];

  filterCliente: string;
  setFilterCliente: (value: string) => void;
  filterEmpresa: string;
  setFilterEmpresa: (value: string) => void;
  filterEstatus: string[];
  setFilterEstatus: (value: string[]) => void;
  filterFechaFinDesde: string;
  setFilterFechaFinDesde: (value: string) => void;
  filterFechaFinHasta: string;
  setFilterFechaFinHasta: (value: string) => void;
  isArchive?: boolean;
  title?: string;
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
  clientes,
  filterCliente,
  setFilterCliente,
  filterEmpresa,
  setFilterEmpresa,
  filterEstatus,
  setFilterEstatus,
  filterFechaFinDesde,
  setFilterFechaFinDesde,
  filterFechaFinHasta,
  setFilterFechaFinHasta,
  isArchive = false,
  title = "Cotizaciones",
}: CotizacionesTemplateProps) {
  const pageSize = 13;

  const [showFilter, setShowFilter] = useState(false);

  // Mapping between UI labels and API values
  const STATUS_OPTIONS = [
    { label: "Validada", value: "Validada" },
    { label: "Aprobada", value: "Aprobada" },
    { label: "Rechazada", value: "Rechazada" },
    { label: "Cancelada", value: "Cancelada" },
    { label: "Pendiente", value: "Pendiente" },
  ];

  return (
    <>
      <AdminHeader title={title} />

      <section className="max-w-[1350px] mx-auto px-4 md:px-6 pt-5 space-y-4">
        {/* Toolbar section */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          <div className="w-full md:flex-1">
            <AdminToolbar
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Buscar por folio o nombre de oportunidad"
              onFiltrar={() => setShowFilter(true)}
            />
          </div>

          {!isArchive ? (
            <Link
              href="/cotizaciones/rechazadas"
              className="flex items-center justify-center gap-2 h-[41px] px-4 rounded-[7px] border border-[#c2c0c0] bg-white font-medium text-[13px] text-[#666] transition-all hover:bg-gray-50 hover:shadow-sm whitespace-nowrap shrink-0"
            >
              <svg width="18" height="18" viewBox="0 0 256 256" fill="currentColor">
                <path d="M224,48H32a8,8,0,0,0-8,8V192a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A8,8,0,0,0,224,48ZM216,192H40V64H216V192ZM96,96a8,8,0,0,1,8-8h48a8,8,0,0,1,0,16H104A8,8,0,0,1,96,96Zm0,32a8,8,0,0,1,8-8h48a8,8,0,0,1,0,16H104A8,8,0,0,1,96,128Zm0,32a8,8,0,0,1,8-8h48a8,8,0,0,1,0,16H104A8,8,0,0,1,96,160Z" />
              </svg>
              Oportunidades Perdidas
            </Link>
          ) : (
            <Link
              href="/cotizaciones"
              className="flex items-center gap-2 h-[41px] px-4 rounded-[7px] border border-[#e42200] bg-white font-medium text-[13px] text-[#e42200] transition-all hover:bg-rose-50 hover:shadow-sm"
            >
              <svg width="18" height="18" viewBox="0 0 256 256" fill="currentColor">
                <path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z" />
              </svg>
              Volver a Cotizaciones
            </Link>
          )}
        </div>

        <CotizacionesFilterSidebar
          open={showFilter}
          onClose={() => setShowFilter(false)}
          clientes={clientes}
          statusOptions={STATUS_OPTIONS}
          filterCliente={filterCliente}
          setFilterCliente={setFilterCliente}
          filterEmpresa={filterEmpresa}
          setFilterEmpresa={setFilterEmpresa}
          filterEstatus={filterEstatus}
          setFilterEstatus={setFilterEstatus}
          filterFechaFinDesde={filterFechaFinDesde}
          setFilterFechaFinDesde={setFilterFechaFinDesde}
          filterFechaFinHasta={filterFechaFinHasta}
          setFilterFechaFinHasta={setFilterFechaFinHasta}
        />

        {/* Table section */}
        <CotizacionesTable
          cotizaciones={cotizaciones}
          onDelete={onDelete}
          onStatusChange={onStatusChange}
        />

        {/* Pagination */}
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
