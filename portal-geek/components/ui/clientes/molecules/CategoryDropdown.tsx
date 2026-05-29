"use client";

import { ChevronDownIcon } from "@/components/ui/atoms/icons";
import { Popover, PopoverItem } from "@/components/ui/primitives/Popover";

export type ClientCategory = "Black" | "Silver" | "Gold" | "Emprendedor" | "Baneado";

const CATEGORY_OPTIONS: ClientCategory[] = ["Black", "Silver", "Gold", "Emprendedor", "Baneado"];

// Trigger pill colors — still encode the current category at-a-glance for
// scanning client tables. The OPEN PANEL is the canonical PopoverItem chrome
// (white, neutral text, red selected highlight) shared by every dropdown.
const CATEGORY_TRIGGER_STYLES: Record<string, { color: string; bg: string; border: string }> = {
  Black: { color: "#ffffff", bg: "#000000", border: "#000000" },
  Silver: { color: "#1e1e1e", bg: "#e0e0e0", border: "#d1d1d1" },
  Gold: { color: "#1e1e1e", bg: "#f4d966", border: "#e0c54d" },
  Emprendedor: { color: "#1e1e1e", bg: "#acf466", border: "#96d65a" },
  Baneado: { color: "#ffffff", bg: "#ff0000", border: "#cc0000" },
};

const DEFAULT_STYLE = { color: "#1e1e1e", bg: "#f0f0f0", border: "#d1d1d1" };

interface CategoryDropdownProps {
  category: string | null;
  onChange?: (category: ClientCategory) => void;
}

export function CategoryDropdown({ category, onChange }: CategoryDropdownProps) {
  const currentCategory = (category as ClientCategory) || "Silver";
  const style = CATEGORY_TRIGGER_STYLES[currentCategory] || DEFAULT_STYLE;

  return (
    <Popover
      align="center"
      panelClassName="min-w-[160px]"
      trigger={
        <button
          type="button"
          className="inline-flex items-center justify-between gap-2 min-w-[110px] px-3 py-1 rounded-full text-sm font-medium font-ibm-plex transition-all shadow-[0_2px_4px_rgba(0,0,0,0.1)] border whitespace-nowrap"
          style={{
            color: style.color,
            backgroundColor: style.bg,
            borderColor: style.border,
          }}
        >
          <span className="truncate">{category || "Sin categoría"}</span>
          <ChevronDownIcon size={12} />
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
