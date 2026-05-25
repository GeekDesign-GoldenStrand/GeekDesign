import { FilterIcon, PlusIcon, SearchIcon } from "@/components/ui/atoms/icons";
import { MaterialesFilterPanel } from "@/components/ui/materiales/molecules/MaterialesFilterPanel";
import type { MaterialSortOrder, MaterialTipoFilter, MaterialesVisibleColumns } from "@/types";

interface MaterialesToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  isFilterOpen: boolean;
  visibleColumns: MaterialesVisibleColumns;
  sortOrder: MaterialSortOrder;
  tipoFilter: MaterialTipoFilter;
  onToggleColumn: (key: keyof MaterialesVisibleColumns) => void;
  onSortChange: (order: MaterialSortOrder) => void;
  onTipoFilterChange: (value: MaterialTipoFilter) => void;
  onResetFilters: () => void;
  onAddClick?: () => void;
  onFilterClick?: () => void;
  onCloseFilter: () => void;
  canViewProveedores?: boolean;
}

export function MaterialesToolbar({
  search,
  onSearchChange,
  isFilterOpen,
  visibleColumns,
  sortOrder,
  tipoFilter,
  onToggleColumn,
  onSortChange,
  onTipoFilterChange,
  onResetFilters,
  onAddClick,
  onFilterClick,
  onCloseFilter,
  canViewProveedores = true,
}: MaterialesToolbarProps) {
  return (
    // The toolbar acts as the anchor container for the floating filter panel.
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-6 relative flex-wrap">
      <div className="flex items-center gap-2 border border-[#b9b8b8] rounded-[4px] px-3 h-[41px] bg-white w-full md:w-[439px]">
        <input
          type="text"
          aria-label="Buscar materiales"
          placeholder="Buscar"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1 text-[14px] font-medium text-[#1e1e1e] placeholder:text-[#8e908f] outline-none bg-transparent"
        />
        <span className="text-[#8e908f]">
          <SearchIcon />
        </span>
      </div>

      <div className="flex items-center justify-start sm:justify-end gap-3 flex-wrap sm:flex-nowrap">
        <button
          onClick={onAddClick}
          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 h-[41px] px-4 rounded-[7px] border border-[#575757] bg-[#e8e8e8] font-ibm-plex font-medium text-[13px] text-[#575757] transition-colors hover:bg-[#d8d8d8] whitespace-nowrap"
        >
          <PlusIcon />
          Agregar
        </button>

        <button
          onClick={onFilterClick}
          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 h-[41px] px-4 rounded-[7px] border border-[#e42200] bg-[#ffecec] font-ibm-plex font-medium text-[13px] text-[#e42200] transition-colors hover:bg-[#ffd5d5] whitespace-nowrap"
        >
          <FilterIcon />
          Filtrar
        </button>
      </div>

      {isFilterOpen && (
        // Filter panel is controlled by page state to keep filters centralized.
        <MaterialesFilterPanel
          visibleColumns={visibleColumns}
          sortOrder={sortOrder}
          tipoFilter={tipoFilter}
          onToggleColumn={onToggleColumn}
          onSortChange={onSortChange}
          onTipoFilterChange={onTipoFilterChange}
          onReset={onResetFilters}
          onClose={onCloseFilter}
          canViewProveedores={canViewProveedores}
        />
      )}
    </div>
  );
}
