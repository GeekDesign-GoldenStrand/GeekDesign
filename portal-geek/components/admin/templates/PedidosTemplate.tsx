"use client";

import { useState, useRef, useEffect } from "react";

import { AdminToolbar } from "@/components/admin/molecules/AdminToolbar";
import { AdminHeader } from "@/components/admin/organisms/AdminHeader";
import { PedidosTable } from "@/components/admin/organisms/PedidosTable";

// Frontend type for an order
type Pedido = {
  id_pedido: number;
  fecha_creacion: string;
  fecha_estimada?: string | null;
  cliente: {
    nombre_cliente: string;
    empresa?: string | null;
  };
  estatus: {
    descripcion: string;
  };
  factura: boolean;
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

  onlyActive: boolean;
  setOnlyActive: (v: boolean) => void;

  serviceIds: number[];
  setServiceIds: (v: number[]) => void;

  estatuses: string[];
  setEstatuses: (v: string[]) => void;

  empresa: string | null;
  setEmpresa: (v: string | null) => void;

  cliente: string | null;
  setCliente: (v: string | null) => void;
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
  onlyActive,
  setOnlyActive,
  serviceIds,
  setServiceIds,
  estatuses,
  setEstatuses,
  empresa,
  setEmpresa,
  cliente,
  setCliente,
}: Props) {
  const [showFilter, setShowFilter] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const pageSize = 10;

  /**
   * UI → API mapping for statuses
   * Keeps UI readable while preserving backend contract
   */
  const STATUS_OPTIONS = [
    { label: "Cotización", value: "Cotizacion" },
    { label: "Pagado", value: "Pagado" },
    { label: "En cola", value: "En_cola" },
    { label: "Aprobación diseño", value: "Aprobacion_diseno" },
    { label: "En producción", value: "En_produccion" },
    { label: "Entregado", value: "Entregado" },
    { label: "Facturado", value: "Facturado" },
  ];

  /**
   * Close filter dropdown when clicking outside
   */
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
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
      <AdminHeader title="Pedidos" />

      <section className="max-w-[1350px] mx-auto px-6 pt-5 space-y-4">
        {/* Toolbar */}
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
              <div className="bg-white p-6 rounded-[14px] w-[21rem] shadow-[0_8px_30px_rgba(0,0,0,0.18)] border-4 border-[#ffc1c1] text-black">
                <h2 className="text-[24px] font-semibold mb-4 text-[#1e1e1e]">
                  Filtros
                </h2>

                {/* Active filter */}
                <label className="flex items-center gap-2 mb-4 text-[13px]">
                  <input
                    type="checkbox"
                    checked={onlyActive}
                    onChange={(e) => setOnlyActive(e.target.checked)}
                    className="accent-[#ff6b6b]"
                  />
                  Mostrar solo activos
                </label>

                {/* Cliente */}
                <div className="mb-3">
                  <p className="text-[13px] font-semibold text-[#575757] mb-1">
                    Cliente
                  </p>
                  <input
                    value={cliente ?? ""}
                    onChange={(e) => setCliente(e.target.value || null)}
                    className="w-full border border-[#ffd6d6] bg-[#fff5f5] rounded-[6px] p-2 focus:outline-none focus:ring-2 focus:ring-[#ff7f7f]"
                  />
                </div>

                {/* Empresa */}
                <div className="mb-3">
                  <p className="text-[13px] font-semibold text-[#575757] mb-1">
                    Empresa
                  </p>
                  <input
                    value={empresa ?? ""}
                    onChange={(e) => setEmpresa(e.target.value || null)}
                    className="w-full border border-[#ffd6d6] bg-[#fff5f5] rounded-[6px] p-2 focus:outline-none focus:ring-2 focus:ring-[#ff7f7f]"
                  />
                </div>

                {/* Estatus */}
                <div className="mb-3">
                  <p className="text-[13px] font-semibold text-[#575757] mb-2">
                    Estatus
                  </p>
                  <div className="space-y-2">
                    {STATUS_OPTIONS.map((s) => (
                      <label
                        key={s.value}
                        className="flex items-center gap-2 text-[13px]"
                      >
                        <input
                          type="checkbox"
                          checked={estatuses.includes(s.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEstatuses([...estatuses, s.value]);
                            } else {
                              setEstatuses(
                                estatuses.filter((x) => x !== s.value)
                              );
                            }
                          }}
                          className="accent-[#ff6b6b]"
                        />
                        {s.label}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Servicios */}
                <div className="mb-3">
                  <p className="text-[13px] font-semibold text-[#575757] mb-2">
                    Servicio
                  </p>
                  <div className="space-y-2">
                    {[
                      { id: 1, name: "Corte Láser" },
                      { id: 2, name: "Grabado Láser" },
                    ].map((service) => (
                      <label
                        key={service.id}
                        className="flex items-center gap-2 text-[13px]"
                      >
                        <input
                          type="checkbox"
                          checked={serviceIds.includes(service.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setServiceIds([...serviceIds, service.id]);
                            } else {
                              setServiceIds(
                                serviceIds.filter((id) => id !== service.id)
                              );
                            }
                          }}
                          className="accent-[#ff6b6b]"
                        />
                        {service.name}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex justify-center gap-3">
                  <button
                    onClick={() => {
                      setOnlyActive(false);
                      setServiceIds([]);
                      setEstatuses([]);
                      setEmpresa(null);
                      setCliente(null);
                    }}
                    className="h-8 px-4 rounded-[6px] bg-[#ffc1c1] text-white text-[13px] font-semibold hover:bg-[#ff9e9e]"
                  >
                    Reset
                  </button>

                  <button
                    onClick={() => setShowFilter(false)}
                    className="h-8 px-6 rounded-[6px] bg-[#ff9e9e] text-white text-[13px] font-semibold hover:bg-[#ff7f7f]"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <PedidosTable
          pedidos={pedidos}
          onDelete={onDelete}
          onStatusChange={onStatusChange}
        />

        {/* Pagination */}
        <div className="flex justify-end mt-8 mb-6 pr-4">
          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="w-[36px] h-[36px] border border-[#d1d1d1] rounded-[4px] flex items-center justify-center hover:bg-gray-50 disabled:opacity-40"
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
                      : "bg-[#f0f0f0] text-[#1e1e1e] hover:bg-gray-200"
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}

            <button
              disabled={page === Math.ceil(total / pageSize)}
              onClick={() => setPage(page + 1)}
              className="w-[36px] h-[36px] border border-[#d1d1d1] rounded-[4px] flex items-center justify-center hover:bg-gray-50 disabled:opacity-40"
            >
              {">"}
            </button>
          </div>
        </div>
      </section>
    </>
  );
}