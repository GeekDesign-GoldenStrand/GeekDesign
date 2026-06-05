"use client";

import { useState } from "react";

import { FilterSidebar, filterSidebarClasses } from "@/components/admin/organisms/FilterSidebar";
import type { MaterialSortOrder, MaterialTipoFilter, MaterialesVisibleColumns } from "@/types";

interface MaterialesFilterPanelProps {
  open: boolean;
  visibleColumns: MaterialesVisibleColumns;
  sortOrder: MaterialSortOrder;
  tipoFilter: MaterialTipoFilter;
  onColumnsChange: (columns: MaterialesVisibleColumns) => void;
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

function defaultColumns(canViewProveedores: boolean): MaterialesVisibleColumns {
  return {
    name: true,
    description: true,
    unit: true,
    width: true,
    height: true,
    thickness: true,
    color: true,
    image: true,
    proveedores: canViewProveedores,
  };
}

export function MaterialesFilterPanel({
  open,
  visibleColumns,
  sortOrder,
  tipoFilter,
  onColumnsChange,
  onSortChange,
  onTipoFilterChange,
  onReset,
  onClose,
  canViewProveedores = true,
}: MaterialesFilterPanelProps) {
  const columnOptions = canViewProveedores
    ? COLUMN_OPTIONS
    : COLUMN_OPTIONS.filter((o) => o.key !== "proveedores");

  // Draft-and-apply: edits stay local until the user clicks "Aplicar", mirroring
  // the *FilterSidebar family. The table never re-filters on each keystroke/click.
  const [draftColumns, setDraftColumns] = useState(visibleColumns);
  const [draftSort, setDraftSort] = useState(sortOrder);
  const [draftTipo, setDraftTipo] = useState(tipoFilter);

  // Resync the draft from the applied filters every time the panel transitions
  // from closed to open, so abandoned edits don't persist across reopens.
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
    setDraftColumns((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      // At least one column must stay visible.
      if (!Object.values(next).some(Boolean)) return prev;
      return next;
    });
  }

  function apply() {
    onColumnsChange(draftColumns);
    onSortChange(draftSort);
    onTipoFilterChange(draftTipo);
    onClose();
  }

  function reset() {
    setDraftColumns(defaultColumns(canViewProveedores));
    setDraftSort("az");
    setDraftTipo("all");
    onReset();
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
              checked={draftTipo === "categorias"}
              onChange={() => setDraftTipo("categorias")}
              className={filterSidebarClasses.checkbox}
            />
            Solo categorías
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
