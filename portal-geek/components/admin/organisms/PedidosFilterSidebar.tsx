"use client";

import { useEffect, useState } from "react";

import { FilterSidebar, filterSidebarClasses } from "@/components/admin/organisms/FilterSidebar";

const STATUS_OPTIONS = [
  { label: "Pendiente", value: "Pendiente" },
  { label: "En producción", value: "En producción" },
  { label: "Finalizado", value: "Finalizado" },
  { label: "Entregado", value: "Entregado" },
  { label: "Cancelado", value: "Cancelado" },
];

type Props = {
  open: boolean;
  onClose: () => void;

  empresa: string | null;
  setEmpresa: (v: string | null) => void;

  cliente: string | null;
  setCliente: (v: string | null) => void;

  estatuses: string[];
  setEstatuses: (v: string[]) => void;

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
  empresa,
  setEmpresa,
  cliente,
  setCliente,
  estatuses,
  setEstatuses,
  fechaEstimadaDesde,
  setFechaEstimadaDesde,
  fechaEstimadaHasta,
  setFechaEstimadaHasta,
  selectedServiceId,
  detalleEstatuses,
  setDetalleEstatuses,
}: Props) {
  const showDetalleStatus = selectedServiceId !== null;

  const [empresaOptions, setEmpresaOptions] = useState<string[]>([]);
  useEffect(() => {
    fetch("/api/pedidos/empresas")
      .then((r) => r.json())
      .then((json: { data: string[] }) => setEmpresaOptions(json.data ?? []))
      .catch(() => {});
  }, []);

  const [draftEmpresa, setDraftEmpresa] = useState<string | null>(empresa);
  const [draftCliente, setDraftCliente] = useState<string | null>(cliente);
  const [draftEstatuses, setDraftEstatuses] = useState<string[]>(estatuses);
  const [draftFechaDesde, setDraftFechaDesde] = useState(fechaEstimadaDesde);
  const [draftFechaHasta, setDraftFechaHasta] = useState(fechaEstimadaHasta);
  const [draftDetalleEstatuses, setDraftDetalleEstatuses] = useState<string[]>(detalleEstatuses);

  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      setDraftEmpresa(empresa);
      setDraftCliente(cliente);
      setDraftEstatuses(estatuses);
      setDraftFechaDesde(fechaEstimadaDesde);
      setDraftFechaHasta(fechaEstimadaHasta);
      setDraftDetalleEstatuses(detalleEstatuses);
    }
  }

  function reset() {
    setDraftEmpresa(null);
    setDraftCliente(null);
    setDraftEstatuses([]);
    setDraftFechaDesde("");
    setDraftFechaHasta("");
    setDraftDetalleEstatuses([]);
    setEmpresa(null);
    setCliente(null);
    setEstatuses([]);
    setFechaEstimadaDesde("");
    setFechaEstimadaHasta("");
    setDetalleEstatuses([]);
  }

  function apply() {
    setEmpresa(draftEmpresa);
    setCliente(draftCliente);
    setEstatuses(draftEstatuses);
    setFechaEstimadaDesde(draftFechaDesde);
    setFechaEstimadaHasta(draftFechaHasta);
    setDetalleEstatuses(draftDetalleEstatuses);
  }

  function toggleStatus(
    value: string,
    checked: boolean,
    draft: string[],
    setDraft: (v: string[]) => void
  ) {
    setDraft(checked ? [...draft, value] : draft.filter((x) => x !== value));
  }

  return (
    <FilterSidebar open={open} onClose={onClose} onApply={apply} onReset={reset}>
      <div>
        <p className={filterSidebarClasses.sectionLabel}>Empresa</p>
        <select
          value={draftEmpresa ?? ""}
          onChange={(e) => setDraftEmpresa(e.target.value || null)}
          className={filterSidebarClasses.input}
        >
          <option value="">Todas</option>
          {empresaOptions.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
      </div>

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

      <div>
        <p className="text-[13px] font-semibold text-[#575757] mb-2">Estatus del pedido</p>
        <div className="space-y-2">
          {STATUS_OPTIONS.map((s) => (
            <label key={s.value} className="flex items-center gap-2 text-[13px]">
              <input
                type="checkbox"
                checked={draftEstatuses.includes(s.value)}
                onChange={(e) =>
                  toggleStatus(s.value, e.target.checked, draftEstatuses, setDraftEstatuses)
                }
                className={filterSidebarClasses.checkbox}
              />
              {s.label}
            </label>
          ))}
        </div>
      </div>

      {showDetalleStatus && (
        <div>
          <p className="text-[13px] font-semibold text-[#575757] mb-2">Estatus del servicio</p>
          <div className="space-y-2">
            {STATUS_OPTIONS.map((s) => (
              <label key={s.value} className="flex items-center gap-2 text-[13px]">
                <input
                  type="checkbox"
                  checked={draftDetalleEstatuses.includes(s.value)}
                  onChange={(e) =>
                    toggleStatus(
                      s.value,
                      e.target.checked,
                      draftDetalleEstatuses,
                      setDraftDetalleEstatuses
                    )
                  }
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
