"use client";

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
  function reset() {
    setFilterNombre("");
    setFilterDireccion("");
    setFilterEstatus([]);
  }

  return (
    <FilterSidebar open={open} onClose={onClose} onReset={reset}>
      <div>
        <p className={filterSidebarClasses.sectionLabel}>Nombre sucursal</p>
        <input
          value={filterNombre}
          onChange={(e) => setFilterNombre(e.target.value)}
          className={filterSidebarClasses.input}
        />
      </div>

      <div>
        <p className={filterSidebarClasses.sectionLabel}>Dirección</p>
        <input
          value={filterDireccion}
          onChange={(e) => setFilterDireccion(e.target.value)}
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
                checked={filterEstatus.includes(status)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFilterEstatus([...filterEstatus, status]);
                  } else {
                    setFilterEstatus(filterEstatus.filter((s) => s !== status));
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
