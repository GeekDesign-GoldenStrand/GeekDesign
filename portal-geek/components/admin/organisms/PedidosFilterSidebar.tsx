"use client";

import { useState } from "react";

import { FilterSidebar, filterSidebarClasses } from "@/components/admin/organisms/FilterSidebar";

// Detail-level statuses (per-service status on a pedido detalle). Keep in
// sync with getAllowedPedidoStatuses in PedidosTable.
const DETALLE_STATUS_OPTIONS = [
  { label: "Pendiente", value: "Pendiente" },
  { label: "En producción", value: "En producción" },
  { label: "Finalizado", value: "Finalizado" },
  { label: "Entregado", value: "Entregado" },
  { label: "Cancelado", value: "Cancelado" },
];

type Props = {
  open: boolean;
  onClose: () => void;

  cliente: string | null;
  setCliente: (v: string | null) => void;

  fechaEstimadaDesde: string;
  setFechaEstimadaDesde: (value: string) => void;
  fechaEstimadaHasta: string;
  setFechaEstimadaHasta: (value: string) => void;

  // When a service is selected via PedidosServiceTabs, the sidebar surfaces
  // a detail-status filter scoped to that service.
  selectedServiceId: number | null;
  detalleEstatuses: string[];
  setDetalleEstatuses: (v: string[]) => void;
};

export function PedidosFilterSidebar({
  open,
  onClose,
  cliente,
  setCliente,
  fechaEstimadaDesde,
  setFechaEstimadaDesde,
  fechaEstimadaHasta,
  setFechaEstimadaHasta,
  selectedServiceId,
  detalleEstatuses,
  setDetalleEstatuses,
}: Props) {
  const showDetalleStatus = selectedServiceId !== null;

  const [draftCliente, setDraftCliente] = useState<string | null>(cliente);
  const [draftFechaDesde, setDraftFechaDesde] = useState(fechaEstimadaDesde);
  const [draftFechaHasta, setDraftFechaHasta] = useState(fechaEstimadaHasta);
  const [draftDetalleEstatuses, setDraftDetalleEstatuses] = useState<string[]>(detalleEstatuses);

  // Resync the draft from the currently applied filters every time the
  // sidebar transitions from closed to open, so abandoned edits don't persist
  // across reopens. See https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      setDraftCliente(cliente);
      setDraftFechaDesde(fechaEstimadaDesde);
      setDraftFechaHasta(fechaEstimadaHasta);
      setDraftDetalleEstatuses(detalleEstatuses);
    }
  }

  function reset() {
    setDraftCliente(null);
    setDraftFechaDesde("");
    setDraftFechaHasta("");
    setDraftDetalleEstatuses([]);
    setCliente(null);
    setFechaEstimadaDesde("");
    setFechaEstimadaHasta("");
    setDetalleEstatuses([]);
  }

  function apply() {
    setCliente(draftCliente);
    setFechaEstimadaDesde(draftFechaDesde);
    setFechaEstimadaHasta(draftFechaHasta);
    setDetalleEstatuses(draftDetalleEstatuses);
  }

  return (
    <FilterSidebar open={open} onClose={onClose} onApply={apply} onReset={reset}>
      <div>
        <p className={filterSidebarClasses.sectionLabel}>Cliente</p>
        <input
          type="search"
          value={draftCliente ?? ""}
          onChange={(e) => setDraftCliente(e.target.value || null)}
          placeholder="Buscar cliente"
          maxLength={50}
          className={filterSidebarClasses.input}
        />
      </div>

      {showDetalleStatus && (
        <div>
          <p className="text-[13px] font-semibold text-[#575757] mb-2">Estatus del servicio</p>
          <div className="space-y-2">
            {DETALLE_STATUS_OPTIONS.map((s) => (
              <label key={s.value} className="flex items-center gap-2 text-[13px]">
                <input
                  type="checkbox"
                  checked={draftDetalleEstatuses.includes(s.value)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setDraftDetalleEstatuses([...draftDetalleEstatuses, s.value]);
                    } else {
                      setDraftDetalleEstatuses(draftDetalleEstatuses.filter((x) => x !== s.value));
                    }
                  }}
                  className={filterSidebarClasses.checkbox}
                />
                {s.label}
              </label>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-[13px] font-semibold text-[#575757] mb-2">Fecha de entrega</p>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col text-[12px] text-[#575757]">
            Desde
            <input
              type="date"
              value={draftFechaDesde}
              onChange={(e) => setDraftFechaDesde(e.target.value)}
              max={draftFechaHasta || undefined}
              className={`mt-1 ${filterSidebarClasses.input}`}
            />
          </label>
          <label className="flex flex-col text-[12px] text-[#575757]">
            Hasta
            <input
              type="date"
              value={draftFechaHasta}
              onChange={(e) => setDraftFechaHasta(e.target.value)}
              min={draftFechaDesde || undefined}
              className={`mt-1 ${filterSidebarClasses.input}`}
            />
          </label>
        </div>
      </div>
    </FilterSidebar>
  );
}
