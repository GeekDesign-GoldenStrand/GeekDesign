"use client";

import { useEffect, useState } from "react";

import { FilterSidebar, filterSidebarClasses } from "@/components/admin/organisms/FilterSidebar";

interface Rol {
  id_rol: number;
  nombre_rol: string;
}

interface FiltrarColaboradoresPanelProps {
  open: boolean;
  roles: Rol[];
  filterEstatus: string;
  filterRoles: number[];
  onEstatusChange: (v: string) => void;
  onRolToggle: (id: number) => void;
  onReset: () => void;
  onClose: () => void;
}

const ESTATUS_OPTIONS = [
  { label: "Todos", value: "" },
  { label: "Activo", value: "Activo" },
  { label: "Inactivo", value: "Inactivo" },
];

export function FiltrarColaboradoresPanel({
  open,
  roles,
  filterEstatus,
  filterRoles,
  onEstatusChange,
  onRolToggle,
  onReset,
  onClose,
}: FiltrarColaboradoresPanelProps) {
  const [draftEstatus, setDraftEstatus] = useState(filterEstatus);
  const [draftRoles, setDraftRoles] = useState<number[]>(filterRoles);

  useEffect(() => {
    if (!open) return;
    setDraftEstatus(filterEstatus);
    setDraftRoles(filterRoles);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function toggleDraftRol(id: number) {
    setDraftRoles((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
  }

  function reset() {
    // Apply parent reset semantics to the draft only.
    setDraftEstatus("");
    setDraftRoles([]);
  }

  function apply() {
    if (draftEstatus !== filterEstatus) onEstatusChange(draftEstatus);

    // Reconcile draftRoles vs filterRoles via onRolToggle.
    const toAdd = draftRoles.filter((r) => !filterRoles.includes(r));
    const toRemove = filterRoles.filter((r) => !draftRoles.includes(r));
    [...toAdd, ...toRemove].forEach(onRolToggle);

    // If parent exposed an onReset and draft matches the reset state, surface it
    // so any side effects in the parent's reset run too.
    if (
      draftEstatus === "" &&
      draftRoles.length === 0 &&
      (filterEstatus !== "" || filterRoles.length !== 0)
    ) {
      onReset();
    }
  }

  return (
    <FilterSidebar open={open} onClose={onClose} onApply={apply} onReset={reset}>
      <div>
        <p className="text-[13px] font-semibold text-[#575757] mb-2">Estado</p>
        <div className="space-y-2">
          {ESTATUS_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2 text-[13px] text-[#1e1e1e] cursor-pointer"
            >
              <input
                type="radio"
                name="colab-estatus"
                checked={draftEstatus === opt.value}
                onChange={() => setDraftEstatus(opt.value)}
                className={filterSidebarClasses.checkbox}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[13px] font-semibold text-[#575757] mb-2">Rol</p>
        <div className="space-y-2">
          {roles.map((r) => (
            <label
              key={r.id_rol}
              className="flex items-center gap-2 text-[13px] text-[#1e1e1e] cursor-pointer"
            >
              <input
                type="checkbox"
                checked={draftRoles.includes(r.id_rol)}
                onChange={() => toggleDraftRol(r.id_rol)}
                className={filterSidebarClasses.checkbox}
              />
              {r.nombre_rol}
            </label>
          ))}
        </div>
      </div>
    </FilterSidebar>
  );
}
