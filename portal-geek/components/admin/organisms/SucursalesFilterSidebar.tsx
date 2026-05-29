"use client";

import { useEffect, useState } from "react";

import { FilterSidebar, filterSidebarClasses } from "@/components/admin/organisms/FilterSidebar";

const ESTATUS_OPTIONS = ["Activo", "Inactivo"];

type Props = {
  open: boolean;
  onClose: () => void;

  filterNombre: string;
  setFilterNombre: (value: string) => void;
  filterDireccion: string;
  setFilterDireccion: (value: string) => void;
  filterEstatus: string[];
  setFilterEstatus: (value: string[]) => void;
};

export function SucursalesFilterSidebar({
  open,
  onClose,
  filterNombre,
  setFilterNombre,
  filterDireccion,
  setFilterDireccion,
  filterEstatus,
  setFilterEstatus,
}: Props) {
  const [draftNombre, setDraftNombre] = useState(filterNombre);
  const [draftDireccion, setDraftDireccion] = useState(filterDireccion);
  const [draftEstatus, setDraftEstatus] = useState<string[]>(filterEstatus);

  useEffect(() => {
    if (!open) return;
    setDraftNombre(filterNombre);
    setDraftDireccion(filterDireccion);
    setDraftEstatus(filterEstatus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function reset() {
    setDraftNombre("");
    setDraftDireccion("");
    setDraftEstatus([]);
  }

  function apply() {
    setFilterNombre(draftNombre);
    setFilterDireccion(draftDireccion);
    setFilterEstatus(draftEstatus);
  }

  return (
    <FilterSidebar open={open} onClose={onClose} onApply={apply} onReset={reset}>
      <div>
        <p className={filterSidebarClasses.sectionLabel}>Nombre sucursal</p>
        <input
          value={draftNombre}
          onChange={(e) => setDraftNombre(e.target.value)}
          className={filterSidebarClasses.input}
        />
      </div>

      <div>
        <p className={filterSidebarClasses.sectionLabel}>Dirección</p>
        <input
          value={draftDireccion}
          onChange={(e) => setDraftDireccion(e.target.value)}
          className={filterSidebarClasses.input}
        />
      </div>

      <div>
        <p className="text-[13px] font-semibold text-[#575757] mb-2">Estatus</p>
        <div className="space-y-2">
          {ESTATUS_OPTIONS.map((status) => (
            <label key={status} className="flex items-center gap-2 text-[13px]">
              <input
                type="checkbox"
                checked={draftEstatus.includes(status)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setDraftEstatus([...draftEstatus, status]);
                  } else {
                    setDraftEstatus(draftEstatus.filter((s) => s !== status));
                  }
                }}
                className={filterSidebarClasses.checkbox}
              />
              {status}
            </label>
          ))}
        </div>
      </div>
    </FilterSidebar>
  );
}
