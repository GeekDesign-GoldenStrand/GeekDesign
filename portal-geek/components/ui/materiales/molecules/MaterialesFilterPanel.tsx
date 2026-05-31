"use client";

import { FilterSidebar, filterSidebarClasses } from "@/components/admin/organisms/FilterSidebar";
import type { MaterialSortOrder, MaterialTipoFilter, MaterialesVisibleColumns } from "@/types";

interface MaterialesFilterPanelProps {
  open: boolean;
  visibleColumns: MaterialesVisibleColumns;
  sortOrder: MaterialSortOrder;
  tipoFilter: MaterialTipoFilter;
  onToggleColumn: (key: keyof MaterialesVisibleColumns) => void;
  onSortChange: (order: MaterialSortOrder) => void;
  onTipoFilterChange: (value: MaterialTipoFilter) => void;
  onReset: () => void;
  onClose: () => void;
  canViewProveedores?: boolean;
}

const COLUMN_OPTIONS: Array<{ key: keyof MaterialesVisibleColumns; label: string }> = [
  { key: "name", label: "Nombre" },
  { key: "description", label: "Descripción" },
  { key: "unit", label: "Unidad de medida" },
  { key: "width", label: "Ancho" },
  { key: "height", label: "Alto" },
  { key: "thickness", label: "Grosor" },
  { key: "color", label: "Color" },
  { key: "image", label: "Imagen" },
  { key: "proveedores", label: "Proveedores" },
];

export function MaterialesFilterPanel({
  open,
  visibleColumns,
  sortOrder,
  tipoFilter,
  onToggleColumn,
  onSortChange,
  onTipoFilterChange,
  onReset,
  onClose,
  canViewProveedores = true,
}: MaterialesFilterPanelProps) {
  const columnOptions = canViewProveedores
    ? COLUMN_OPTIONS
    : COLUMN_OPTIONS.filter((o) => o.key !== "proveedores");

  return (
    <FilterSidebar open={open} onClose={onClose} onReset={onReset}>
      <div>
        <p className="text-[13px] font-semibold text-[#575757] mb-2">Columnas</p>
        <div className="space-y-2">
          {columnOptions.map((option) => (
            <label
              key={option.key}
              className="flex items-center gap-2 text-[13px] text-[#1e1e1e] cursor-pointer"
            >
              <input
                type="checkbox"
                checked={visibleColumns[option.key]}
                onChange={() => onToggleColumn(option.key)}
                className={filterSidebarClasses.checkbox}
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[13px] font-semibold text-[#575757] mb-2">Orden</p>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-[13px] text-[#1e1e1e] cursor-pointer">
            <input
              type="radio"
              name="material-order"
              checked={sortOrder === "az"}
              onChange={() => onSortChange("az")}
              className={filterSidebarClasses.checkbox}
            />
            De la A a la Z
          </label>
          <label className="flex items-center gap-2 text-[13px] text-[#1e1e1e] cursor-pointer">
            <input
              type="radio"
              name="material-order"
              checked={sortOrder === "za"}
              onChange={() => onSortChange("za")}
              className={filterSidebarClasses.checkbox}
            />
            De la Z a la A
          </label>
        </div>
      </div>

      <div>
        <p className="text-[13px] font-semibold text-[#575757] mb-2">Ver</p>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-[13px] text-[#1e1e1e] cursor-pointer">
            <input
              type="radio"
              name="material-tipo"
              checked={tipoFilter === "all"}
              onChange={() => onTipoFilterChange("all")}
              className={filterSidebarClasses.checkbox}
            />
            Todos
          </label>
          <label className="flex items-center gap-2 text-[13px] text-[#1e1e1e] cursor-pointer">
            <input
              type="radio"
              name="material-tipo"
              checked={tipoFilter === "categorias"}
              onChange={() => onTipoFilterChange("categorias")}
              className={filterSidebarClasses.checkbox}
            />
            Solo categorías
          </label>
          <label className="flex items-center gap-2 text-[13px] text-[#1e1e1e] cursor-pointer">
            <input
              type="radio"
              name="material-tipo"
              checked={tipoFilter === "grupos"}
              onChange={() => onTipoFilterChange("grupos")}
              className={filterSidebarClasses.checkbox}
            />
            Solo grupos
          </label>
          <label className="flex items-center gap-2 text-[13px] text-[#1e1e1e] cursor-pointer">
            <input
              type="radio"
              name="material-tipo"
              checked={tipoFilter === "individuales"}
              onChange={() => onTipoFilterChange("individuales")}
              className={filterSidebarClasses.checkbox}
            />
            Sin grupo
          </label>
        </div>
      </div>
    </FilterSidebar>
  );
}
