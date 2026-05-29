"use client";

import { useEffect, useState } from "react";

import { FilterSidebar, filterSidebarClasses } from "@/components/admin/organisms/FilterSidebar";

type ClienteOption = { id: number; nombre: string };

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

  clientes: ClienteOption[];

  cliente: string | null;
  setCliente: (v: string | null) => void;
  empresa: string | null;
  setEmpresa: (v: string | null) => void;

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
  clientes,
  cliente,
  setCliente,
  empresa,
  setEmpresa,
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
  const [draftEmpresa, setDraftEmpresa] = useState<string | null>(empresa);
  const [draftDesde, setDraftDesde] = useState(fechaEstimadaDesde);
  const [draftHasta, setDraftHasta] = useState(fechaEstimadaHasta);
  const [draftDetalle, setDraftDetalle] = useState<string[]>(detalleEstatuses);

  useEffect(() => {
    if (!open) return;
    setDraftCliente(cliente);
    setDraftEmpresa(empresa);
    setDraftDesde(fechaEstimadaDesde);
    setDraftHasta(fechaEstimadaHasta);
    setDraftDetalle(detalleEstatuses);
    // Only re-sync when sidebar opens — values that change while open are drafts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function reset() {
    setDraftCliente(null);
    setDraftEmpresa(null);
    setDraftDesde("");
    setDraftHasta("");
    setDraftDetalle([]);
  }

  function apply() {
    setCliente(draftCliente);
    setEmpresa(draftEmpresa);
    setFechaEstimadaDesde(draftDesde);
    setFechaEstimadaHasta(draftHasta);
    setDetalleEstatuses(draftDetalle);
  }

  return (
    <FilterSidebar open={open} onClose={onClose} onApply={apply} onReset={reset}>
      <div>
        <p className={filterSidebarClasses.sectionLabel}>Cliente</p>
        <select
          value={draftCliente ?? ""}
          onChange={(e) => setDraftCliente(e.target.value || null)}
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
          value={draftEmpresa ?? ""}
          onChange={(e) => setDraftEmpresa(e.target.value || null)}
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
                  checked={draftDetalle.includes(s.value)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setDraftDetalle([...draftDetalle, s.value]);
                    } else {
                      setDraftDetalle(draftDetalle.filter((x) => x !== s.value));
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
