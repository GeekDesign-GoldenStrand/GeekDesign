"use client";

import { X } from "@phosphor-icons/react";
import { useEffect } from "react";

type StatusOption = { label: string; value: string };
type ClienteOption = { id: number; nombre: string };

type Props = {
  open: boolean;
  onClose: () => void;

  clientes: ClienteOption[];
  statusOptions: StatusOption[];

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
};

export function CotizacionesFilterSidebar({
  open,
  onClose,
  clientes,
  statusOptions,
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
}: Props) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  function reset() {
    setFilterCliente("");
    setFilterEmpresa("");
    setFilterEstatus([]);
    setFilterFechaFinDesde("");
    setFilterFechaFinHasta("");
  }

  return (
    <>
      <div
        aria-hidden={!open}
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Filtros de cotizaciones"
        className={`fixed top-0 right-0 z-50 h-full w-full sm:w-[22rem] bg-white shadow-[0_0_30px_rgba(0,0,0,0.18)] text-black transform transition-transform duration-200 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-6 pt-6 pb-4">
            <h2 className="text-[24px] font-semibold text-[#1e1e1e]">Filtros</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar filtros"
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-4">
            <div>
              <p className="text-[13px] font-semibold text-[#575757] mb-1">Cliente</p>
              <select
                value={filterCliente}
                onChange={(e) => setFilterCliente(e.target.value)}
                className="w-full border border-gray-200 bg-gray-50 rounded-[6px] p-2 focus:outline-none focus:ring-2 focus:ring-gray-300 transition"
              >
                <option value="">Todos</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.nombre}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <p className="text-[13px] font-semibold text-[#575757] mb-1">Empresa</p>
              <input
                value={filterEmpresa}
                onChange={(e) => setFilterEmpresa(e.target.value)}
                className="w-full border border-gray-200 bg-gray-50 rounded-[6px] p-2 focus:outline-none focus:ring-2 focus:ring-gray-300 transition"
              />
            </div>

            <div>
              <p className="text-[13px] font-semibold text-[#575757] mb-2">Estatus</p>
              <div className="space-y-2">
                {statusOptions.map((status) => (
                  <label key={status.value} className="flex items-center gap-2 text-[13px]">
                    <input
                      type="checkbox"
                      checked={filterEstatus.includes(status.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilterEstatus([...filterEstatus, status.value]);
                        } else {
                          setFilterEstatus(filterEstatus.filter((s) => s !== status.value));
                        }
                      }}
                      className="accent-gray-400"
                    />
                    {status.label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[13px] font-semibold text-[#575757] mb-2">Fecha de entrega</p>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex flex-col text-[12px] text-[#575757]">
                  Desde
                  <input
                    type="date"
                    value={filterFechaFinDesde}
                    onChange={(e) => setFilterFechaFinDesde(e.target.value)}
                    max={filterFechaFinHasta || undefined}
                    className="mt-1 border border-gray-200 bg-gray-50 rounded-[6px] p-2 focus:outline-none focus:ring-2 focus:ring-gray-300 transition"
                  />
                </label>
                <label className="flex flex-col text-[12px] text-[#575757]">
                  Hasta
                  <input
                    type="date"
                    value={filterFechaFinHasta}
                    onChange={(e) => setFilterFechaFinHasta(e.target.value)}
                    min={filterFechaFinDesde || undefined}
                    className="mt-1 border border-gray-200 bg-gray-50 rounded-[6px] p-2 focus:outline-none focus:ring-2 focus:ring-gray-300 transition"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-3 px-6 py-4 border-t border-gray-100">
            <button
              type="button"
              onClick={reset}
              className="h-9 px-4 rounded-[6px] bg-gray-200 text-gray-800 text-[13px] font-semibold hover:bg-gray-300 transition"
            >
              Restablecer
            </button>
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-6 rounded-[6px] bg-red-600 text-white text-[13px] font-semibold hover:bg-red-800 transition"
            >
              Aplicar
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
