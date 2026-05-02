"use client";

import { useState, useRef, useEffect } from "react";

import { AdminToolbar } from "@/components/admin/molecules/AdminToolbar";
import { AdminHeader } from "@/components/admin/organisms/AdminHeader";
import { PedidosTable } from "@/components/admin/organisms/PedidosTable";

// Frontend type for an order (pedido)
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

// Props define the data and callbacks passed into the template
type Props = {
  pedidos: Pedido[];
  search: string;
  setSearch: (v: string) => void;

  page: number;
  setPage: (p: number) => void;
  total: number;

  onDelete: (id: number) => void;
  onStatusChange: (id: number, status: string) => void;

  // Filters
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

  // Close filter dropdown when clicking outside
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

      <section className="max-w-[1350px] mx-auto pt-5 space-y-4">
        {/* Toolbar with search, add, and filter actions */}
        <div className="relative">
          <AdminToolbar
            search={search}
            onSearchChange={setSearch}
            onAgregar={() => {
              // Placeholder for "add order" logic
            }}
            onFiltrar={() => setShowFilter((prev) => !prev)}
          />

          {/* Filter dropdown (visible when showFilter is true) */}
          {showFilter && (
            <div ref={filterRef} className="absolute right-0 mt-2 z-50">
              <div className="bg-white p-6 rounded-[14px] w-[21rem] shadow-[0_8px_30px_rgba(0,0,0,0.18)] border-4 border-[#ff7f7f] text-black">
                <h2 className="text-[24px] font-semibold mb-4">Filtros</h2>

                {/* Active orders filter */}
                <label className="flex items-center gap-2 mb-4 text-[13px]">
                  <input
                    type="checkbox"
                    checked={onlyActive}
                    onChange={(e) => setOnlyActive(e.target.checked)}
                    className="accent-[#ff7f7f]"
                  />
                  Mostrar solo activos
                </label>

                {/* Client filter */}
                <div className="mb-3">
                  <p className="text-[13px] font-semibold text-[#575757] mb-1">Cliente</p>
                  <input
                    value={cliente ?? ""}
                    onChange={(e) => setCliente(e.target.value || null)}
                    className="w-full border border-[#b9b8b8] rounded-[6px] p-2"
                  />
                </div>

                {/* Company filter */}
                <div className="mb-3">
                  <p className="text-[13px] font-semibold text-[#575757] mb-1">Empresa</p>
                  <input
                    value={empresa ?? ""}
                    onChange={(e) => setEmpresa(e.target.value || null)}
                    className="w-full border border-[#b9b8b8] rounded-[6px] p-2"
                  />
                </div>

                {/* Status filter (multi-select checkboxes) */}
                <div className="mb-3">
                  <p className="text-[13px] font-semibold text-[#575757] mb-2">Estatus</p>
                  <div className="space-y-2">
                    {["Cotizacion", "Pagado", "En_cola", "Aprobacion_diseno"].map((s) => (
                      <label key={s} className="flex items-center gap-2 text-[13px]">
                        <input
                          type="checkbox"
                          checked={estatuses.includes(s)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEstatuses([...estatuses, s]);
                            } else {
                              setEstatuses(estatuses.filter((x) => x !== s));
                            }
                          }}
                          className="accent-[#ff7f7f]"
                        />
                        {s}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Service filter (multi-select checkboxes) */}
                <div className="mb-3">
                  <p className="text-[13px] font-semibold text-[#575757] mb-2">Servicio</p>
                  <div className="space-y-2">
                    {[
                      { id: 1, name: "Corte Láser" },
                      { id: 2, name: "Grabado Láser" },
                    ].map((service) => (
                      <label key={service.id} className="flex items-center gap-2 text-[13px]">
                        <input
                          type="checkbox"
                          checked={serviceIds.includes(service.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setServiceIds([...serviceIds, service.id]);
                            } else {
                              setServiceIds(serviceIds.filter((id) => id !== service.id));
                            }
                          }}
                          className="accent-[#ff7f7f]"
                        />
                        {service.name}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Filter action buttons */}
                <div className="mt-4 flex justify-center gap-3">
                  <button
                    onClick={() => {
                      setOnlyActive(false);
                      setServiceIds([]);
                      setEstatuses([]);
                      setEmpresa(null);
                      setCliente(null);
                    }}
                    className="h-7 px-3 rounded-[6px] bg-[#ff7f7f] text-white text-[12px] font-semibold hover:bg-[#f36a6a]"
                  >
                    Restablecer
                  </button>

                  <button
                    onClick={() => setShowFilter(false)}
                    className="h-7 px-6 rounded-[6px] bg-[#ff7f7f] text-white text-[12px] font-semibold hover:bg-[#f36a6a]"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Orders table */}
        <PedidosTable pedidos={pedidos} onDelete={onDelete} onStatusChange={onStatusChange} />

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
