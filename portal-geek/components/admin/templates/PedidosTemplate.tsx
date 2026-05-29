"use client";

import Link from "next/link";
import { useState } from "react";

import {
  PedidosServiceTabs,
  type PedidoServiceOption,
} from "@/components/admin/molecules/PedidosServiceTabs";
import { SearchBar } from "@/components/admin/molecules/SearchBar";
import { AdminHeader } from "@/components/admin/organisms/AdminHeader";
import PedidoDetailModal from "@/components/admin/organisms/PedidoDetailModal";
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

  cliente: string | null;
  setCliente: (v: string | null) => void;

  fechaEstimadaDesde: string;
  setFechaEstimadaDesde: (value: string) => void;
  fechaEstimadaHasta: string;
  setFechaEstimadaHasta: (value: string) => void;

  detalleEstatuses: string[];
  setDetalleEstatuses: (v: string[]) => void;

  services: PedidoServiceOption[];
  selectedServiceId: number | null;
  onServiceSelect: (id: number | null) => void;
  onDetalleStatusChange: (detalleId: number, status: string) => void;

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
  cliente,
  setCliente,
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
  role,
}: Props) {
  const [showFilter, setShowFilter] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);
  const pageSize = 10;

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
              className="flex items-center justify-center gap-1.5 h-[41px] px-4 rounded-[7px] border border-[#e42200] bg-[#ffecec] font-ibm-plex font-medium text-[13px] text-[#e42200] transition-colors hover:bg-[#ffd5d5] whitespace-nowrap shrink-0"
            >
              <FilterIcon />
              Filtrar
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

        <PedidosFilterSidebar
          open={showFilter}
          onClose={() => setShowFilter(false)}
          cliente={cliente}
          setCliente={setCliente}
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
          onShowDetail={setDetailId}
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

      {/* PE-05 — order detail window opened from the info icon */}
      {detailId !== null && (
        <PedidoDetailModal
          key={detailId}
          pedidoId={detailId}
          selectedServiceId={selectedServiceId}
          onClose={() => setDetailId(null)}
          role={role}
        />
      )}
    </>
  );
}
