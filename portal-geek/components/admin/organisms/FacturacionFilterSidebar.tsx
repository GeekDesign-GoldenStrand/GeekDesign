"use client";

import { useState } from "react";

import { FilterSidebar, filterSidebarClasses } from "@/components/admin/organisms/FilterSidebar";

const ESTATUS_OPTIONS = [
  { value: "Cotizacion", label: "Pendiente de facturar" },
  { value: "Facturado", label: "Facturado" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  clienteEmpresa: string | null;
  setClienteEmpresa: (v: string | null) => void;
  estatusFactura: string[];
  setEstatusFactura: (v: string[]) => void;
}

export function FacturacionFilterSidebar({
  open,
  onClose,
  clienteEmpresa,
  setClienteEmpresa,
  estatusFactura,
  setEstatusFactura,
}: Props) {
  const [draftCliente, setDraftCliente] = useState<string | null>(clienteEmpresa);
  const [draftEstatus, setDraftEstatus] = useState<string[]>(estatusFactura);

  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      setDraftCliente(clienteEmpresa);
      setDraftEstatus(estatusFactura);
    }
  }

  function apply() {
    setClienteEmpresa(draftCliente);
    setEstatusFactura(draftEstatus);
  }

  function reset() {
    setDraftCliente(null);
    setDraftEstatus([]);
    setClienteEmpresa(null);
    setEstatusFactura([]);
  }

  function toggleEstatus(value: string, checked: boolean) {
    setDraftEstatus(checked ? [...draftEstatus, value] : draftEstatus.filter((s) => s !== value));
  }

  return (
    <FilterSidebar open={open} onClose={onClose} onApply={apply} onReset={reset}>
      <div>
        <p className={filterSidebarClasses.sectionLabel}>Cliente / Empresa</p>
        <input
          type="search"
          value={draftCliente ?? ""}
          onChange={(e) => setDraftCliente(e.target.value || null)}
          placeholder="Buscar cliente o empresa"
          className={filterSidebarClasses.input}
        />
      </div>
      <div>
        <p className={filterSidebarClasses.sectionLabel}>Estatus de factura</p>
        <div className="space-y-2">
          {ESTATUS_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 text-[13px]">
              <input
                type="checkbox"
                checked={draftEstatus.includes(opt.value)}
                onChange={(e) => toggleEstatus(opt.value, e.target.checked)}
                className={filterSidebarClasses.checkbox}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>
    </FilterSidebar>
  );
}
