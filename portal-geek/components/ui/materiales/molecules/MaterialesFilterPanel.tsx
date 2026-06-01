"use client";

import { useState } from "react";

import { FilterSidebar, filterSidebarClasses } from "@/components/admin/organisms/FilterSidebar";
import type { MaterialSortOrder, MaterialTipoFilter } from "@/types";

interface MaterialesFilterPanelProps {
  open: boolean;
  sortOrder: MaterialSortOrder;
  tipoFilter: MaterialTipoFilter;
  onSortChange: (order: MaterialSortOrder) => void;
  onTipoFilterChange: (value: MaterialTipoFilter) => void;
  onReset: () => void;
  onClose: () => void;
}

export function MaterialesFilterPanel({
  open,
  sortOrder,
  tipoFilter,
  onSortChange,
  onTipoFilterChange,
  onReset,
  onClose,
}: MaterialesFilterPanelProps) {
  const [draftSort, setDraftSort] = useState<MaterialSortOrder>(sortOrder);
  const [draftTipo, setDraftTipo] = useState<MaterialTipoFilter>(tipoFilter);

  function apply() {
    onSortChange(draftSort);
    onTipoFilterChange(draftTipo);
    onClose();
  }

  function reset() {
    setDraftSort("az");
    setDraftTipo("all");
    onReset();
  }

  return (
    <FilterSidebar open={open} onClose={onClose} onApply={apply} onReset={reset}>
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
