import { SearchIcon } from "@/components/ui/atoms/icons";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
};

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative flex h-[41px] w-[439px] shrink-0 items-center rounded-[4px] border border-[#b9b8b8] bg-white px-3">
      <input
        placeholder="Buscar"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-transparent font-ibm-plex text-[14px] font-medium text-[#333] outline-none placeholder:text-[#8e908f] pr-10"
      />

      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-10 text-gray-400 hover:text-gray-700"
        >
          ✕
        </button>
      )}

      <span className="absolute right-3 text-[#8e908f]">
        <SearchIcon />
      </span>
    </div>
  );
}
