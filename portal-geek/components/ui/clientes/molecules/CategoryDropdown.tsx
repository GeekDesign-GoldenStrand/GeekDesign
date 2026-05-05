"use client";

import { useEffect, useRef, useState } from "react";

import { ChevronDownIcon, CheckIcon } from "@/components/ui/atoms/icons";

export type ClientCategory = "Black" | "Silver" | "Gold" | "Emprendedor" | "Baneado";

const CATEGORY_OPTIONS: ClientCategory[] = ["Black", "Silver", "Gold", "Emprendedor", "Baneado"];

const CATEGORY_STYLES: Record<string, { color: string; bg: string; border: string }> = {
  Black: { color: "#ffffff", bg: "#000000", border: "#000000" },
  Silver: { color: "#1e1e1e", bg: "#e0e0e0", border: "#d1d1d1" },
  Gold: { color: "#1e1e1e", bg: "#f4d966", border: "#e0c54d" },
  Emprendedor: { color: "#1e1e1e", bg: "#acf466", border: "#96d65a" },
  Baneado: { color: "#ffffff", bg: "#ff0000", border: "#cc0000" },
};

interface CategoryDropdownProps {
  category: string | null;
  onChange?: (category: ClientCategory) => void;
}

export function CategoryDropdown({ category, onChange }: CategoryDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const currentCategory = (category as ClientCategory) || "Silver";
  const style = CATEGORY_STYLES[currentCategory] || {
    color: "#1e1e1e",
    bg: "#f0f0f0",
    border: "#d1d1d1",
  };

  function handleSelect(option: ClientCategory) {
    setOpen(false);
    if (option !== category) onChange?.(option);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center justify-between min-w-[140px] h-[38px] px-4 rounded-[19px] text-[14px] font-bold font-ibm-plex transition-all shadow-[0_2px_4px_rgba(0,0,0,0.1)] border"
        style={{
          color: style.color,
          backgroundColor: style.bg,
          borderColor: style.border,
        }}
      >
        <span className="truncate">{category || "Sin categoría"}</span>
        <span className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`}>
          <ChevronDownIcon size={14} />
        </span>
      </button>

      {open && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 min-w-[160px] bg-white rounded-[12px] shadow-[0_8px_30px_rgba(0,0,0,0.2)] border border-gray-100 overflow-hidden p-1 flex flex-col gap-1">
          {CATEGORY_OPTIONS.map((opt) => {
            const optStyle = CATEGORY_STYLES[opt];
            const isSelected = opt === category;

            return (
              <button
                key={opt}
                onClick={() => handleSelect(opt)}
                className="w-full text-left px-4 py-2.5 text-[15px] font-bold rounded-[8px] flex items-center justify-between transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  backgroundColor: optStyle.bg,
                  color: optStyle.color,
                  opacity: isSelected ? 0.6 : 1,
                  cursor: isSelected ? "default" : "pointer",
                }}
              >
                <span>{opt}</span>
                {isSelected && <CheckIcon size={16} style={{ color: optStyle.color }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
