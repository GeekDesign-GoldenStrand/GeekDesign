"use client";

import { useState } from "react";

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
  setFilterEstatus: (v: string) => void;
  setFilterRoles: (v: number[]) => void;
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
  setFilterEstatus,
  setFilterRoles,
  onClose,
}: FiltrarColaboradoresPanelProps) {
  const [draftEstatus, setDraftEstatus] = useState(filterEstatus);
  const [draftRoles, setDraftRoles] = useState<number[]>(filterRoles);

  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      setDraftEstatus(filterEstatus);
      setDraftRoles(filterRoles);
    }
  }

  function toggleRol(id: number) {
    setDraftRoles((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
  }

  function reset() {
    setDraftEstatus("");
    setDraftRoles([]);
    setFilterEstatus("");
    setFilterRoles([]);
  }

  function apply() {
    setFilterEstatus(draftEstatus);
    setFilterRoles(draftRoles);
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
                onChange={() => toggleRol(r.id_rol)}
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
