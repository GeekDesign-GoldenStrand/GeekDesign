"use client";

import { SearchBar } from "@/components/admin/molecules/SearchBar";
import { FilterIcon, PlusIcon } from "@/components/ui/atoms/icons";

interface AdminToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  onAgregar?: () => void;
  onFiltrar?: () => void;
  agregarLabel?: string;
  tabs?: string[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function AdminToolbar({
  search,
  onSearchChange,
  onAgregar,
  onFiltrar,
  agregarLabel = "Agregar",
  tabs,
  activeTab,
  onTabChange,
}: AdminToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 flex-wrap mb-6">
      {tabs && tabs.length > 0 && (
        <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto pb-2 sm:pb-0 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => onTabChange?.(tab)}
              className={`text-[14px] sm:text-[18px] font-medium transition-all px-3 sm:px-4 py-1.5 rounded-[20px] whitespace-nowrap ${
                activeTab === tab
                  ? "bg-[rgba(0,106,255,0.65)] text-white"
                  : "text-[#1e1e1e] hover:opacity-70"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      <SearchBar value={search} onChange={onSearchChange} />

      {(onAgregar || onFiltrar) && (
        <div className="flex items-center justify-start sm:justify-end gap-3 flex-wrap sm:flex-nowrap">
          {onAgregar && (
            <button
              type="button"
              onClick={onAgregar}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 h-[41px] px-4 rounded-[7px] border border-[#575757] bg-[#e8e8e8] font-ibm-plex font-medium text-[13px] text-[#575757] transition-colors hover:bg-[#d8d8d8] whitespace-nowrap"
            >
              <PlusIcon />
              {agregarLabel}
            </button>
          )}

          {onFiltrar && (
            <button
              type="button"
              onClick={onFiltrar}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 h-[41px] px-4 rounded-[7px] border border-[#e42200] bg-[#ffecec] font-ibm-plex font-medium text-[13px] text-[#e42200] transition-colors hover:bg-[#ffd5d5] whitespace-nowrap"
            >
              <FilterIcon />
              Filtrar
            </button>
          )}
        </div>
      )}
    </div>
  );
}
