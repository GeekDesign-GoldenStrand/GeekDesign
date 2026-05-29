"use client";

import { CaretDown } from "@phosphor-icons/react";

import { Popover, PopoverItem } from "@/components/ui/primitives/Popover";

export type ClientCategory = "Black" | "Silver" | "Gold" | "Emprendedor" | "Baneado";

const CATEGORY_OPTIONS: ClientCategory[] = ["Black", "Silver", "Gold", "Emprendedor", "Baneado"];

// Trigger pill colors — still encode the current category at-a-glance for
// scanning client tables. The OPEN PANEL is the canonical PopoverItem chrome
// (white, neutral text, red selected highlight) shared by every dropdown.
const CATEGORY_TRIGGER_STYLES: Record<string, { color: string; bg: string }> = {
  Black: { color: "#ffffff", bg: "#000000" },
  Silver: { color: "#1e1e1e", bg: "#e0e0e0" },
  Gold: { color: "#1e1e1e", bg: "#f4d966" },
  Emprendedor: { color: "#1e1e1e", bg: "#acf466" },
  Baneado: { color: "#ffffff", bg: "#ff0000" },
};

const DEFAULT_STYLE = { color: "#1e1e1e", bg: "#f0f0f0" };

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
          className="rounded-full cursor-pointer flex items-center gap-2 pl-4 pr-3 py-1 text-sm font-medium whitespace-nowrap"
          style={{
            color: style.color,
            backgroundColor: style.bg,
          }}
        >
          <span className="whitespace-nowrap">{category || "Sin categoría"}</span>
          <CaretDown size={14} weight="bold" />
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
