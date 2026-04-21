import type { TercerosTab as Tab } from "@/types";

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
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}

interface TercerosToolbarProps {
  tabs: Tab[];
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  search: string;
  onSearchChange: (value: string) => void;
}

export default function TercerosToolbar({
  tabs,
  activeTab,
  onTabChange,
  search,
  onSearchChange,
}: TercerosToolbarProps) {
  return (
    <div className="flex items-center gap-4 mb-6 flex-wrap">
      <div className="flex items-center gap-4">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
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

      <div className="flex items-center gap-2 border border-[#b9b8b8] rounded-sm px-3 py-2 bg-white w-109.75">
        <input
          type="text"
          aria-label="Buscar terceros"
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
        <button className="flex items-center gap-1.5 bg-[#e8e8e8] border border-[#575757] text-[#575757] text-[20px] font-medium rounded-[7px] px-4 h-[2.5625rem] hover:bg-[#d8d8d8]">
          <PlusIcon />
          Agregar
        </button>

        <button className="flex items-center gap-1.5 bg-[#ffecec] border border-[#e42200] text-[#e42200] text-[20px] font-medium rounded-[7px] px-4 h-[2.5625rem] hover:bg-[#ffe0dc]">
          <FilterIcon />
          Filtrar
        </button>
      </div>
    </div>
  );
}
