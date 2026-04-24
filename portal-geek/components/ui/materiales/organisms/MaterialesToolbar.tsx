import { FilterIcon, PlusIcon, SearchIcon } from "@/components/ui/atoms/icons";
import { MaterialesFilterPanel } from "@/components/ui/materiales/molecules/MaterialesFilterPanel";
import type { MaterialSortOrder, MaterialesVisibleColumns } from "@/types";

interface MaterialesToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  isFilterOpen: boolean;
  visibleColumns: MaterialesVisibleColumns;
  sortOrder: MaterialSortOrder;
  onToggleColumn: (key: keyof MaterialesVisibleColumns) => void;
  onSortChange: (order: MaterialSortOrder) => void;
  onResetFilters: () => void;
  onAddClick?: () => void;
  onFilterClick?: () => void;
  onCloseFilter: () => void;
}

export function MaterialesToolbar({
  search,
  onSearchChange,
  isFilterOpen,
  visibleColumns,
  sortOrder,
  onToggleColumn,
  onSortChange,
  onResetFilters,
  onAddClick,
  onFilterClick,
  onCloseFilter,
}: MaterialesToolbarProps) {
  return (
    // The toolbar acts as the anchor container for the floating filter panel.
    <div className="flex items-center gap-4 mb-6 flex-wrap relative">
      <div className="flex items-center gap-2 border border-[#b9b8b8] rounded-sm px-3 py-2 bg-white w-109.75 max-w-full">
        <input
          type="text"
          aria-label="Buscar materiales"
          placeholder="Buscar"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1 text-[14px] font-medium text-[#1e1e1e] placeholder:text-[#8e908f] outline-none"
        />
        <span className="text-[#8e908f]">
          <SearchIcon />
        </span>
      </div>

      <div className="flex items-center gap-3 ml-auto">
        <button
          onClick={onAddClick}
          className="flex items-center gap-1.5 bg-[#e8e8e8] border border-[#575757] text-[#575757] text-[20px] font-medium rounded-[7px] px-4 h-[2.5625rem] hover:bg-[#d8d8d8]"
        >
          <PlusIcon />
          Agregar
        </button>

        <button
          onClick={onFilterClick}
          className="flex items-center gap-1.5 bg-[#ffecec] border border-[#e42200] text-[#e42200] text-[20px] font-medium rounded-[7px] px-4 h-[2.5625rem] hover:bg-[#ffe0dc]"
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
          onToggleColumn={onToggleColumn}
          onSortChange={onSortChange}
          onReset={onResetFilters}
          onClose={onCloseFilter}
        />
      )}
    </div>
  );
}
