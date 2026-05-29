"use client";

import { useEffect, useState } from "react";

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
  const [draftCliente, setDraftCliente] = useState(filterCliente);
  const [draftEmpresa, setDraftEmpresa] = useState(filterEmpresa);
  const [draftEstatus, setDraftEstatus] = useState<string[]>(filterEstatus);
  const [draftDesde, setDraftDesde] = useState(filterFechaFinDesde);
  const [draftHasta, setDraftHasta] = useState(filterFechaFinHasta);

  useEffect(() => {
    if (!open) return;
    setDraftCliente(filterCliente);
    setDraftEmpresa(filterEmpresa);
    setDraftEstatus(filterEstatus);
    setDraftDesde(filterFechaFinDesde);
    setDraftHasta(filterFechaFinHasta);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function reset() {
    setDraftCliente("");
    setDraftEmpresa("");
    setDraftEstatus([]);
    setDraftDesde("");
    setDraftHasta("");
  }

  function apply() {
    setFilterCliente(draftCliente);
    setFilterEmpresa(draftEmpresa);
    setFilterEstatus(draftEstatus);
    setFilterFechaFinDesde(draftDesde);
    setFilterFechaFinHasta(draftHasta);
  }

  return (
    <FilterSidebar open={open} onClose={onClose} onApply={apply} onReset={reset}>
      <div>
        <p className={filterSidebarClasses.sectionLabel}>Cliente</p>
        <select
          value={draftCliente}
          onChange={(e) => setDraftCliente(e.target.value)}
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
          value={draftEmpresa}
          onChange={(e) => setDraftEmpresa(e.target.value)}
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
                checked={draftEstatus.includes(status.value)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setDraftEstatus([...draftEstatus, status.value]);
                  } else {
                    setDraftEstatus(draftEstatus.filter((s) => s !== status.value));
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
              value={draftDesde}
              onChange={(e) => setDraftDesde(e.target.value)}
              max={draftHasta || undefined}
              className={`mt-1 ${filterSidebarClasses.input}`}
            />
          </label>
          <label className="flex flex-col text-[12px] text-[#575757]">
            Hasta
            <input
              type="date"
              value={draftHasta}
              onChange={(e) => setDraftHasta(e.target.value)}
              min={draftDesde || undefined}
              className={`mt-1 ${filterSidebarClasses.input}`}
            />
          </label>
        </div>
      </div>
    </FilterSidebar>
  );
}
