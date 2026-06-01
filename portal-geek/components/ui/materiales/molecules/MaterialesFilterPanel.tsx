"use client";

import { useState } from "react";

import { FilterSidebar, filterSidebarClasses } from "@/components/admin/organisms/FilterSidebar";
import type { MaterialSortOrder, MaterialTipoFilter, MaterialesVisibleColumns } from "@/types";

interface MaterialesFilterPanelProps {
  open: boolean;
  visibleColumns: MaterialesVisibleColumns;
  sortOrder: MaterialSortOrder;
  tipoFilter: MaterialTipoFilter;
  defaultVisibleColumns: MaterialesVisibleColumns;
  setVisibleColumns: (v: MaterialesVisibleColumns) => void;
  setSortOrder: (order: MaterialSortOrder) => void;
  setTipoFilter: (value: MaterialTipoFilter) => void;
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
  defaultVisibleColumns,
  setVisibleColumns,
  setSortOrder,
  setTipoFilter,
  onClose,
  canViewProveedores = true,
}: MaterialesFilterPanelProps) {
  const columnOptions = canViewProveedores
    ? COLUMN_OPTIONS
    : COLUMN_OPTIONS.filter((o) => o.key !== "proveedores");

  const [draftColumns, setDraftColumns] = useState<MaterialesVisibleColumns>(visibleColumns);
  const [draftSort, setDraftSort] = useState<MaterialSortOrder>(sortOrder);
  const [draftTipo, setDraftTipo] = useState<MaterialTipoFilter>(tipoFilter);

  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      setDraftColumns(visibleColumns);
      setDraftSort(sortOrder);
      setDraftTipo(tipoFilter);
    }
  }

  function toggleDraftColumn(key: keyof MaterialesVisibleColumns) {
    setDraftColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function reset() {
    setDraftColumns(defaultVisibleColumns);
    setDraftSort("az");
    setDraftTipo("all");
    setVisibleColumns(defaultVisibleColumns);
    setSortOrder("az");
    setTipoFilter("all");
  }

  function apply() {
    setVisibleColumns(draftColumns);
    setSortOrder(draftSort);
    setTipoFilter(draftTipo);
  }

  return (
    <FilterSidebar open={open} onClose={onClose} onApply={apply} onReset={reset}>
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
                checked={draftColumns[option.key]}
                onChange={() => toggleDraftColumn(option.key)}
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
              checked={draftSort === "az"}
              onChange={() => setDraftSort("az")}
              className={filterSidebarClasses.checkbox}
            />
            De la A a la Z
          </label>
          <label className="flex items-center gap-2 text-[13px] text-[#1e1e1e] cursor-pointer">
            <input
              type="radio"
              name="material-order"
              checked={draftSort === "za"}
              onChange={() => setDraftSort("za")}
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
              checked={draftTipo === "all"}
              onChange={() => setDraftTipo("all")}
              className={filterSidebarClasses.checkbox}
            />
            Todos
          </label>
          <label className="flex items-center gap-2 text-[13px] text-[#1e1e1e] cursor-pointer">
            <input
              type="radio"
              name="material-tipo"
              checked={draftTipo === "grupos"}
              onChange={() => setDraftTipo("grupos")}
              className={filterSidebarClasses.checkbox}
            />
            Solo grupos
          </label>
          <label className="flex items-center gap-2 text-[13px] text-[#1e1e1e] cursor-pointer">
            <input
              type="radio"
              name="material-tipo"
              checked={draftTipo === "individuales"}
              onChange={() => setDraftTipo("individuales")}
              className={filterSidebarClasses.checkbox}
            />
            Sin grupo
          </label>
        </div>
      </div>
    </FilterSidebar>
  );
}
