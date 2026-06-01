"use client";

import { ChevronDownIcon } from "@/components/ui/atoms/icons";
import { Popover, PopoverItem } from "@/components/ui/primitives/Popover";

export type ClientCategory = "Black" | "Silver" | "Gold" | "Emprendedor" | "Baneado";

const CATEGORY_OPTIONS: ClientCategory[] = ["Black", "Silver", "Gold", "Emprendedor", "Baneado"];

// Bordered-pill chrome mirrors the terceros StatusDropdown and the
// colaboradores StatusTag: rounded-[7px], 1px border in the entry color,
// faint tinted background, a 4px drop shadow, and a CaretDown affordance.
// Same Tailwind formula on the trigger — only the color tokens change per
// category — so all three admin entity dropdowns read as one component family.
const TRIGGER_STYLES: Record<ClientCategory, string> = {
  Black: "bg-[rgba(30,30,30,0.15)] border-[#1e1e1e] text-[#1e1e1e]",
  Silver: "bg-[rgba(142,144,143,0.12)] border-[#8e908f] text-[#5a5a5a]",
  Gold: "bg-[rgba(212,160,23,0.10)] border-[#d4a017] text-[#b58a1a]",
  Emprendedor: "bg-[rgba(0,200,83,0.07)] border-[#00c853] text-[#00c853]",
  Baneado: "bg-[rgba(255,23,68,0.07)] border-[#ff1744] text-[#ff1744]",
};

// Used when the column is empty or holds a value outside the known set.
const FALLBACK_STYLE = "bg-[rgba(142,144,143,0.10)] border-[#b9b8b8] text-[#8e908f]";

interface CategoryDropdownProps {
  category: string | null;
  onChange?: (category: ClientCategory) => void;
}

export function CategoryDropdown({ category, onChange }: CategoryDropdownProps) {
  const isKnown = category != null && (CATEGORY_OPTIONS as readonly string[]).includes(category);
  const triggerStyle = isKnown ? TRIGGER_STYLES[category as ClientCategory] : FALLBACK_STYLE;

  return (
    <Popover
      align="start"
      panelClassName="min-w-[160px]"
      trigger={
        <button
          type="button"
          className={`flex items-center justify-center gap-1 min-w-[84px] px-2 py-0.5 rounded-[7px] border text-[14px] font-medium shadow-[0px_4px_10px_0px_rgba(0,0,0,0.25)] transition-all ${triggerStyle}`}
        >
          {category || "Sin categoría"}
          <ChevronDownIcon />
        </button>
      }
    >
      <div className="flex flex-col gap-1">
        {CATEGORY_OPTIONS.map((opt) => (
          <PopoverItem
            key={opt}
            selected={opt === category}
            onSelect={() => {
              if (opt !== category) onChange?.(opt);
            }}
          >
            {opt}
          </PopoverItem>
        ))}
      </div>
    </Popover>
  );
}
