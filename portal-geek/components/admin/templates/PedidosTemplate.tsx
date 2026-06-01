"use client";

import { CheckCircle, WarningCircle, StopCircle, Info } from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";

import {
  PedidosServiceTabs,
  type PedidoServiceOption,
} from "@/components/admin/molecules/PedidosServiceTabs";
import { SearchBar } from "@/components/admin/molecules/SearchBar";
import { AdminHeader } from "@/components/admin/organisms/AdminHeader";
import { PedidosFilterSidebar } from "@/components/admin/organisms/PedidosFilterSidebar";
import { PedidosTable } from "@/components/admin/organisms/PedidosTable";
import { FilterIcon } from "@/components/ui/atoms/icons";
import type { UserRole } from "@/types";

// Frontend type for an order
type Pedido = {
  id_pedido: number;
  fecha_creacion: string;
  fecha_estimada?: string | null;
  monto_total?: number | null;
  nombre_oportunidad?: string | null;

  cliente: {
    nombre_cliente: string;
    empresa?: string | null;
  };

  estatus: {
    descripcion: string;
  };

  estado_factura?: {
    descripcion: string;
  } | null;

  archivos: { id: number; nombre: string }[];
};

// Props
type Props = {
  pedidos: Pedido[];
  search: string;
  setSearch: (v: string) => void;

  page: number;
  setPage: (p: number) => void;
  total: number;

  onDelete: (id: number) => void;
  onStatusChange: (id: number, status: string) => void;

  clienteEmpresa: string | null;
  setClienteEmpresa: (v: string | null) => void;

  estatuses: string[];
  setEstatuses: (v: string[]) => void;

  fechaEstimadaDesde: string;
  setFechaEstimadaDesde: (value: string) => void;
  fechaEstimadaHasta: string;
  setFechaEstimadaHasta: (value: string) => void;

  detalleEstatuses: string[];
  setDetalleEstatuses: (v: string[]) => void;

  services: PedidoServiceOption[];
  selectedServiceId: number | null;
  onServiceSelect: (id: number | null) => void;
  onDetalleStatusChange: (detalleIds: number[], status: string) => void;

  title?: string;
  historyButtonHref?: string;
  historyButtonLabel?: string;
  backButtonHref?: string;
  backButtonLabel?: string;
  showServiceTabs?: boolean;
  role?: UserRole;
};

export function PedidosTemplate({
  pedidos,
  search,
  setSearch,
  page,
  setPage,
  total,
  onDelete,
  onStatusChange,
  clienteEmpresa,
  setClienteEmpresa,
  estatuses,
  setEstatuses,
  fechaEstimadaDesde,
  setFechaEstimadaDesde,
  fechaEstimadaHasta,
  setFechaEstimadaHasta,
  detalleEstatuses,
  setDetalleEstatuses,
  services,
  selectedServiceId,
  onServiceSelect,
  onDetalleStatusChange,
  title = "Pedidos",
  historyButtonHref,
  historyButtonLabel,
  backButtonHref,
  backButtonLabel,
  showServiceTabs = true,
  role: _role,
}: Props) {
  const [showFilter, setShowFilter] = useState(false);
  const pageSize = 10;

  const activeFilterChips = [
    clienteEmpresa
      ? {
          key: "clienteEmpresa",
          label: `Cliente/Empresa: ${clienteEmpresa}`,
          clear: () => setClienteEmpresa(null),
        }
      : null,
    ...estatuses.map((s) => ({
      key: `estatus-${s}`,
      label: s,
      clear: () => setEstatuses(estatuses.filter((e) => e !== s)),
    })),
    fechaEstimadaDesde
      ? {
          key: "desde",
          label: `Desde: ${fechaEstimadaDesde}`,
          clear: () => setFechaEstimadaDesde(""),
        }
      : null,
    fechaEstimadaHasta
      ? {
          key: "hasta",
          label: `Hasta: ${fechaEstimadaHasta}`,
          clear: () => setFechaEstimadaHasta(""),
        }
      : null,
    ...detalleEstatuses.map((s) => ({
      key: `detalle-${s}`,
      label: `Servicio: ${s}`,
      clear: () => setDetalleEstatuses(detalleEstatuses.filter((e) => e !== s)),
    })),
  ].filter((c): c is NonNullable<typeof c> => c !== null);

  const filterCount = activeFilterChips.length;

  function clearAllFilters() {
    setClienteEmpresa(null);
    setEstatuses([]);
    setFechaEstimadaDesde("");
    setFechaEstimadaHasta("");
    setDetalleEstatuses([]);
  }

  return (
    <>
      <AdminHeader title={title} />

      <section className="max-w-[1350px] mx-auto px-4 md:px-6 pt-8 space-y-6">
        {/* Service filter tabs */}
        {showServiceTabs && (
          <div className="pt-2">
            <PedidosServiceTabs
              services={services}
              selectedServiceId={selectedServiceId}
              onSelectService={onServiceSelect}
            />
          </div>
        )}

        {/* Toolbar — search + filter on the left, history/back button on the right */}
        <div className="flex items-center justify-between gap-3">
          {/* Left group: search + filter */}
          <div className="flex items-center gap-6">
            <div className="min-w-0 w-[430px]">
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Buscar por folio o nombre de oportunidad"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowFilter(true)}
              className="relative flex items-center justify-center gap-1.5 h-[41px] px-4 rounded-[7px] border border-[#e42200] bg-[#ffecec] font-ibm-plex font-medium text-[13px] text-[#e42200] transition-colors hover:bg-[#ffd5d5] whitespace-nowrap shrink-0"
            >
              <FilterIcon />
              Filtrar
              {filterCount > 0 && (
                <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-[#e42200] text-white text-[10px] font-bold flex items-center justify-center leading-none">
                  {filterCount}
                </span>
              )}
            </button>
          </div>

          {/* Right group: nav buttons */}
          <div className="flex items-center gap-3">
            {backButtonHref && backButtonLabel && (
              <Link
                href={backButtonHref}
                className="h-[41px] px-6 rounded-md border border-[#c6c6c6] bg-white text-[#575757] text-sm font-semibold flex items-center justify-center whitespace-nowrap shrink-0 hover:border-[#8e908f] hover:text-[#1e1e1e] transition"
              >
                ← {backButtonLabel}
              </Link>
            )}

            {historyButtonHref && historyButtonLabel && (
              <Link
                href={historyButtonHref}
                className="h-[41px] px-6 rounded-md border border-[#c6c6c6] bg-white text-[#575757] text-sm font-semibold flex items-center justify-center whitespace-nowrap shrink-0 hover:border-[#8e908f] hover:text-[#1e1e1e] transition"
              >
                {historyButtonLabel}
              </Link>
            )}
          </div>
        </div>

        {/* Active filter chips */}
        {activeFilterChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {activeFilterChips.map((chip) => (
              <span
                key={chip.key}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ffecec] border border-[#e42200]/30 text-[12px] font-medium text-[#e42200]"
              >
                {chip.label}
                <button
                  type="button"
                  onClick={chip.clear}
                  aria-label={`Quitar filtro ${chip.label}`}
                  className="leading-none hover:text-[#b31a00]"
                >
                  ×
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-[12px] text-[#8e908f] underline hover:text-[#1e1e1e] transition-colors"
            >
              Limpiar todo
            </button>
          </div>
        )}

        <PedidosFilterSidebar
          open={showFilter}
          onClose={() => setShowFilter(false)}
          clienteEmpresa={clienteEmpresa}
          setClienteEmpresa={setClienteEmpresa}
          estatuses={estatuses}
          setEstatuses={setEstatuses}
          fechaEstimadaDesde={fechaEstimadaDesde}
          setFechaEstimadaDesde={setFechaEstimadaDesde}
          fechaEstimadaHasta={fechaEstimadaHasta}
          setFechaEstimadaHasta={setFechaEstimadaHasta}
          selectedServiceId={selectedServiceId}
          detalleEstatuses={detalleEstatuses}
          setDetalleEstatuses={setDetalleEstatuses}
        />

        {/* Table */}
        <PedidosTable
          pedidos={pedidos}
          onDelete={onDelete}
          onStatusChange={onStatusChange}
          selectedServiceId={selectedServiceId}
          onDetalleStatusChange={onDetalleStatusChange}
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

        {/* Leyenda / Index */}
        <div
          id="pedidos-index"
          className="flex flex-col md:flex-row justify-between gap-8 pt-8 pb-12 border-t border-[#e8e8e8] text-base"
        >
          {/* Semáforo de Servicios */}
          <div className="space-y-4">
            <h4 className="font-bold uppercase tracking-[0.5px] text-[14px] text-[#575757]">
              Semáforo de Servicios{" "}
              <button
                type="button"
                aria-label="Ver leyenda del semáforo"
                className="inline-flex ml-2 cursor-pointer bg-transparent border-0 p-0 leading-none align-middle"
                onClick={() =>
                  document.getElementById("pedidos-index")?.scrollIntoView({ behavior: "smooth" })
                }
              >
                <Info size={16} className="text-[#6f6f6f]" />
              </button>
            </h4>
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-[#F7B9FF] text-[#700188] flex items-center justify-center font-bold text-sm">
                  1
                </span>
                <span className="text-[#1e1e1e] font-medium">Pendiente</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-[#FFE4A5] text-[#8A6F02] flex items-center justify-center font-bold text-sm">
                  1
                </span>
                <span className="text-[#1e1e1e] font-medium">En producción</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-[#CCFFA5] text-[#2A940D] flex items-center justify-center font-bold text-sm">
                  1
                </span>
                <span className="text-[#1e1e1e] font-medium">Finalizado</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-[#B9EEFF] text-[#043B66] flex items-center justify-center font-bold text-sm">
                  1
                </span>
                <span className="text-[#1e1e1e] font-medium">Entregado</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-[#B1B1B1] text-black flex items-center justify-center font-bold text-sm">
                  1
                </span>
                <span className="text-[#1e1e1e] font-medium">Cancelado</span>
              </div>
            </div>
          </div>

          {/* Estatus de Facturación */}
          <div className="space-y-4">
            <h4 className="font-bold uppercase tracking-[0.5px] text-[14px] text-[#575757]">
              Estatus de Factura
            </h4>
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-3">
                <CheckCircle size={24} className="text-[#6ACE0D]" weight="fill" />
                <span className="text-[#1e1e1e] font-medium">Facturado</span>
              </div>
              <div className="flex items-center gap-3">
                <WarningCircle size={24} className="text-[#E42200]" weight="fill" />
                <span className="text-[#1e1e1e] font-medium">En proceso / Pendiente</span>
              </div>
              <div className="flex items-center gap-3">
                <StopCircle size={24} className="text-gray-400" weight="fill" />
                <span className="text-[#1e1e1e] font-medium">No se requiere factura</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
