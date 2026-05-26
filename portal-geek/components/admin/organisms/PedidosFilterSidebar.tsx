"use client";

import { FilterSidebar, filterSidebarClasses } from "@/components/admin/organisms/FilterSidebar";

type ClienteOption = { id: number; nombre: string };

type Props = {
  open: boolean;
  onClose: () => void;

  clientes: ClienteOption[];

  cliente: string | null;
  setCliente: (v: string | null) => void;
  empresa: string | null;
  setEmpresa: (v: string | null) => void;

  fechaEstimadaDesde: string;
  setFechaEstimadaDesde: (value: string) => void;
  fechaEstimadaHasta: string;
  setFechaEstimadaHasta: (value: string) => void;
};

export function PedidosFilterSidebar({
  open,
  onClose,
  clientes,
  cliente,
  setCliente,
  empresa,
  setEmpresa,
  fechaEstimadaDesde,
  setFechaEstimadaDesde,
  fechaEstimadaHasta,
  setFechaEstimadaHasta,
}: Props) {
  function reset() {
    setCliente(null);
    setEmpresa(null);
    setFechaEstimadaDesde("");
    setFechaEstimadaHasta("");
  }

  return (
    <FilterSidebar open={open} onClose={onClose} onReset={reset}>
      <div>
        <p className={filterSidebarClasses.sectionLabel}>Cliente</p>
        <select
          value={cliente ?? ""}
          onChange={(e) => setCliente(e.target.value || null)}
          className={filterSidebarClasses.input}
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
        <p className={filterSidebarClasses.sectionLabel}>Empresa</p>
        <input
          value={empresa ?? ""}
          onChange={(e) => setEmpresa(e.target.value || null)}
          className={filterSidebarClasses.input}
        />
      </div>

      <div>
        <p className="text-[13px] font-semibold text-[#575757] mb-2">Fecha de entrega</p>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col text-[12px] text-[#575757]">
            Desde
            <input
              type="date"
              value={fechaEstimadaDesde}
              onChange={(e) => setFechaEstimadaDesde(e.target.value)}
              max={fechaEstimadaHasta || undefined}
              className={`mt-1 ${filterSidebarClasses.input}`}
            />
          </label>
          <label className="flex flex-col text-[12px] text-[#575757]">
            Hasta
            <input
              type="date"
              value={fechaEstimadaHasta}
              onChange={(e) => setFechaEstimadaHasta(e.target.value)}
              min={fechaEstimadaDesde || undefined}
              className={`mt-1 ${filterSidebarClasses.input}`}
            />
          </label>
        </div>
      </div>
    </FilterSidebar>
  );
}
