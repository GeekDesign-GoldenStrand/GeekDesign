"use client";

import { FilterSidebar, filterSidebarClasses } from "@/components/admin/organisms/FilterSidebar";

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
  function reset() {
    setFilterCliente("");
    setFilterEmpresa("");
    setFilterEstatus([]);
    setFilterFechaFinDesde("");
    setFilterFechaFinHasta("");
  }

  return (
    <FilterSidebar open={open} onClose={onClose} onReset={reset}>
      <div>
        <p className={filterSidebarClasses.sectionLabel}>Cliente</p>
        <select
          value={filterCliente}
          onChange={(e) => setFilterCliente(e.target.value)}
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
          value={filterEmpresa}
          onChange={(e) => setFilterEmpresa(e.target.value)}
          className={filterSidebarClasses.input}
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
                className={filterSidebarClasses.checkbox}
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
              className={`mt-1 ${filterSidebarClasses.input}`}
            />
          </label>
          <label className="flex flex-col text-[12px] text-[#575757]">
            Hasta
            <input
              type="date"
              value={filterFechaFinHasta}
              onChange={(e) => setFilterFechaFinHasta(e.target.value)}
              min={filterFechaFinDesde || undefined}
              className={`mt-1 ${filterSidebarClasses.input}`}
            />
          </label>
        </div>
      </div>
    </FilterSidebar>
  );
}
