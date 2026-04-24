interface AsignacionCardProps {
  id: number;
  name: string;
  description?: string;
  selected: boolean;
  onToggle: () => void;
}

export function AsignacionCard({
  name,
  description,
  selected,
  onToggle,
}: AsignacionCardProps) {
  return (
    <div
      onClick={onToggle}
      className={`group relative p-4 rounded-[12px] border transition-all duration-300 cursor-pointer flex flex-col gap-1.5 ${
        selected
          ? "bg-[rgba(0,106,255,0.04)] border-[#006aff] shadow-[0_2px_10px_rgba(0,106,255,0.08)]"
          : "bg-white border-[#e0e0e0] hover:border-[#b9b8b8] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
      }`}
    >
      <div className="flex justify-between items-start">
        <h4 className={`font-semibold text-[15px] transition-colors ${
          selected ? "text-[#006aff]" : "text-[#1e1e1e]"
        }`}>
          {name}
        </h4>
        <div
          className={`h-5 w-5 rounded-full border flex items-center justify-center transition-all ${
            selected ? "bg-[#006aff] border-[#006aff]" : "bg-white border-[#b9b8b8]"
          }`}
        >
          {selected && (
            <svg
              className="h-3 w-3 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="4"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>
      </div>
      {description && (
        <p className="text-[13px] text-[#575757] line-clamp-2 leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}
