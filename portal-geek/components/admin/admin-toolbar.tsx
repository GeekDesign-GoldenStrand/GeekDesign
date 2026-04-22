"use client";

function SearchIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

interface AdminToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  onAgregar?: () => void;
  onFiltrar?: () => void;
  agregarLabel?: string;
}

export function AdminToolbar({
  search,
  onSearchChange,
  onAgregar,
  onFiltrar,
  agregarLabel = "Agregar",
}: AdminToolbarProps) {
  return (
    <div className="flex items-center gap-4">
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

      <div className="ml-auto flex items-center gap-4">
        <button
          type="button"
          onClick={onAgregar}
          className="flex h-[41px] w-[147px] shrink-0 items-center justify-center rounded-[7px] border border-[#575757] bg-[#e8e8e8] font-ibm-plex font-medium text-[20px] text-[#575757] transition-colors hover:bg-[#d8d8d8]"
        >
          + {agregarLabel}
        </button>

        <button
          type="button"
          onClick={onFiltrar}
          className="flex h-[41px] w-[147px] shrink-0 items-center justify-center gap-2 rounded-[7px] border border-[#e42200] bg-[#ffecec] font-ibm-plex font-medium text-[20px] text-[#e42200] transition-colors hover:bg-[#ffd5d5]"
        >
          <FilterIcon />
          Filtrar
        </button>
      </div>
    </div>
  );
}
