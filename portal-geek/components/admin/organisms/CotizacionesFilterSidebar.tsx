"use client";

import { useState } from "react";

import { FilterSidebar, filterSidebarClasses } from "@/components/admin/organisms/FilterSidebar";

type StatusOption = { label: string; value: string };

type Props = {
  open: boolean;
  onClose: () => void;

  statusOptions: StatusOption[];

  filterCliente: string;
  setFilterCliente: (value: string) => void;
  filterEstatus: string[];
  setFilterEstatus: (value: string[]) => void;
  resetEstatus?: string[];
  filterFechaFinDesde: string;
  setFilterFechaFinDesde: (value: string) => void;
  filterFechaFinHasta: string;
  setFilterFechaFinHasta: (value: string) => void;
};

export function CotizacionesFilterSidebar({
  open,
  onClose,
  statusOptions,
  filterCliente,
  setFilterCliente,
  filterEstatus,
  setFilterEstatus,
  resetEstatus = [],
  filterFechaFinDesde,
  setFilterFechaFinDesde,
  filterFechaFinHasta,
  setFilterFechaFinHasta,
}: Props) {
  const [draftCliente, setDraftCliente] = useState(filterCliente);
  const [draftEstatus, setDraftEstatus] = useState<string[]>(filterEstatus);
  const [draftFechaFinDesde, setDraftFechaFinDesde] = useState(filterFechaFinDesde);
  const [draftFechaFinHasta, setDraftFechaFinHasta] = useState(filterFechaFinHasta);

  // Resync the draft from the currently applied filters every time the
  // sidebar transitions from closed to open, so abandoned edits don't persist
  // across reopens. See https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      setDraftCliente(filterCliente);
      setDraftEstatus(filterEstatus);
      setDraftFechaFinDesde(filterFechaFinDesde);
      setDraftFechaFinHasta(filterFechaFinHasta);
    }
  }

  function reset() {
    setDraftCliente("");
    setDraftEstatus(resetEstatus);
    setDraftFechaFinDesde("");
    setDraftFechaFinHasta("");
    setFilterCliente("");
    setFilterEstatus(resetEstatus);
    setFilterFechaFinDesde("");
    setFilterFechaFinHasta("");
  }

  function apply() {
    setFilterCliente(draftCliente);
    setFilterEstatus(draftEstatus);
    setFilterFechaFinDesde(draftFechaFinDesde);
    setFilterFechaFinHasta(draftFechaFinHasta);
  }

  return (
    <FilterSidebar open={open} onClose={onClose} onApply={apply} onReset={reset}>
      <div>
        <p className={filterSidebarClasses.sectionLabel}>Cliente / Empresa</p>
        <input
          type="search"
          value={draftCliente}
          onChange={(e) => setDraftCliente(e.target.value)}
          placeholder="Buscar cliente o empresa"
          maxLength={50}
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
              value={draftFechaFinDesde}
              onChange={(e) => setDraftFechaFinDesde(e.target.value)}
              max={draftFechaFinHasta || undefined}
              className={`mt-1 ${filterSidebarClasses.input}`}
            />
          </label>
          <label className="flex flex-col text-[12px] text-[#575757]">
            Hasta
            <input
              type="date"
              value={draftFechaFinHasta}
              onChange={(e) => setDraftFechaFinHasta(e.target.value)}
              min={draftFechaFinDesde || undefined}
              className={`mt-1 ${filterSidebarClasses.input}`}
            />
          </label>
        </div>
      </div>
    </FilterSidebar>
  );
}
