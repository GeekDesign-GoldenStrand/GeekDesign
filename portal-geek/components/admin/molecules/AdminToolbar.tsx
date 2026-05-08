"use client";

import { FilterIcon, PlusIcon, SearchIcon } from "@/components/ui/atoms/icons";

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
    <div className="flex items-center gap-4 flex-wrap mb-6">
      {tabs && tabs.length > 0 && (
        <div className="flex items-center gap-4">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => onTabChange?.(tab)}
              className={`text-[18px] font-medium transition-all px-4 py-1.5 rounded-[20px] ${
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

      <div className="flex h-[41px] w-[439px] shrink-0 items-center gap-2 rounded-[4px] border border-[#b9b8b8] bg-white px-3">
        <input
          type="search"
          placeholder="Buscar"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1 bg-transparent font-ibm-plex text-[14px] font-medium text-[#333] outline-none placeholder:text-[#8e908f]"
        />
        <span className="shrink-0 text-[#8e908f]">
          <SearchIcon />
        </span>
      </div>

      {(onAgregar || onFiltrar) && (
        <div className="ml-auto flex items-center gap-3">
          {onAgregar && (
            <button
              type="button"
              onClick={onAgregar}
              className="flex items-center gap-1.5 h-[41px] px-4 rounded-[7px] border border-[#575757] bg-[#e8e8e8] font-ibm-plex font-medium text-[20px] text-[#575757] transition-colors hover:bg-[#d8d8d8]"
            >
              <PlusIcon />
              {agregarLabel}
            </button>
          )}

          {onFiltrar && (
            <button
              type="button"
              onClick={onFiltrar}
              className="flex items-center gap-1.5 h-[41px] px-4 rounded-[7px] border border-[#e42200] bg-[#ffecec] font-ibm-plex font-medium text-[20px] text-[#e42200] transition-colors hover:bg-[#ffd5d5]"
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
