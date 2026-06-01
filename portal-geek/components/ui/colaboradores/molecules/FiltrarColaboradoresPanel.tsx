"use client";

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
  return (
    <FilterSidebar open={open} onClose={onClose} onReset={onReset}>
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
                checked={filterEstatus === opt.value}
                onChange={() => onEstatusChange(opt.value)}
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
                checked={filterRoles.includes(r.id_rol)}
                onChange={() => onRolToggle(r.id_rol)}
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
