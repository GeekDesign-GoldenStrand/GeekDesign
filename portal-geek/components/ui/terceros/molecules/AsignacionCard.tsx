interface AsignacionCardProps {
  id: number;
  name: string;
  description?: string;
  selected: boolean;
  onToggle: () => void;
  activeColor?: string;
}

export function AsignacionCard({
  name,
  description,
  selected,
  onToggle,
  activeColor = "#006aff",
}: AsignacionCardProps) {
  return (
    <div
      onClick={onToggle}
      className={`group relative p-4 rounded-[12px] border transition-all duration-300 cursor-pointer flex flex-col gap-1.5 ${
        selected
          ? "border-current shadow-[0_4px_15px_rgba(0,0,0,0.1)]"
          : "bg-white border-[#e0e0e0] hover:border-[#b9b8b8] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
      }`}
      style={{
        backgroundColor: selected ? `${activeColor}10` : undefined,
        borderColor: selected ? activeColor : undefined,
        color: selected ? activeColor : undefined,
      }}
    >
      <div className="flex justify-between items-start">
        <h4
          className="font-semibold text-[16px] transition-colors"
          style={{ color: selected ? activeColor : "#1e1e1e" }}
        >
          {name}
        </h4>
        <div
          className={`h-5 w-5 rounded-full border flex items-center justify-center transition-all`}
          style={{
            backgroundColor: selected ? activeColor : "white",
            borderColor: selected ? activeColor : "#b9b8b8",
          }}
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
