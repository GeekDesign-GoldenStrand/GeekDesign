interface AsignacionCardProps {
  id: number;
  name: string;
  description?: string;
  selected: boolean;
  price: string;
  notes: string;
  onToggle: () => void;
  onPriceChange: (val: string) => void;
  onNotesChange: (val: string) => void;
}

export function AsignacionCard({
  name,
  description,
  selected,
  price,
  notes,
  onToggle,
  onPriceChange,
  onNotesChange,
}: AsignacionCardProps) {
  return (
    <div
      className={`relative p-4 rounded-[12px] border transition-all duration-300 flex flex-col gap-1.5 w-full ${
        selected
          ? "bg-[rgba(0,106,255,0.04)] border-[#006aff] shadow-[0_2px_10px_rgba(0,106,255,0.08)]"
          : "bg-white border-[#e0e0e0] hover:border-[#b9b8b8] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={selected}
        className="flex justify-between items-start w-full text-left cursor-pointer"
      >
        <h4
          className={`font-semibold text-[15px] transition-colors ${
            selected ? "text-[#006aff]" : "text-[#1e1e1e]"
          }`}
        >
          {name}
        </h4>
        <div
          className={`h-5 w-5 rounded-full border flex items-center justify-center transition-all flex-shrink-0 ml-2 ${
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
      </button>

      {description && (
        <p className="text-[13px] text-[#575757] line-clamp-2 leading-relaxed">{description}</p>
      )}

      {selected && (
        <div className="mt-2 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <label className="text-[13px] text-[#1e1e1e] font-medium whitespace-nowrap">
              Precio:
            </label>
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[13px] text-[#575757]">
                $
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === "" || /^\d{0,6}(\.\d{0,2})?$/.test(raw)) onPriceChange(raw);
                }}
                onClick={(e) => e.stopPropagation()}
                placeholder="0.00"
                className="w-full pl-6 pr-3 py-1.5 text-[13px] text-[#1e1e1e] border border-[#c8d8ff] rounded-[7px] bg-white focus:outline-none focus:ring-2 focus:ring-[#006aff]/20 focus:border-[#006aff] transition-colors placeholder:text-[#b9b8b8]"
              />
            </div>
          </div>

          <div className="flex items-start gap-2">
            <label className="text-[13px] text-[#1e1e1e] font-medium whitespace-nowrap pt-1.5">
              Notas:
            </label>
            <div className="relative flex-1">
              <input
                type="text"
                value={notes}
                maxLength={50}
                onChange={(e) => onNotesChange(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                placeholder="Observaciones sobre el precio..."
                className="w-full px-3 py-1.5 text-[13px] text-[#1e1e1e] border border-[#c8d8ff] rounded-[7px] bg-white focus:outline-none focus:ring-2 focus:ring-[#006aff]/20 focus:border-[#006aff] transition-colors placeholder:text-[#b9b8b8]"
              />
              <span className="absolute right-2 bottom-[-16px] text-[11px] text-[#b9b8b8]">
                {notes.length}/50
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
