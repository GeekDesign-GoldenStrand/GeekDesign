"use client";

import { CaretRight } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useRef, useState } from "react";

import { CheckIcon } from "../../atoms/icons";

const STATUS_CONFIGS: Record<string, { color: string; bg: string }> = {
  Activa: { color: "#00c853", bg: "rgba(105, 255, 168, 0.07)" },
  Inactiva: { color: "#ffb300", bg: "rgba(255,179,0,0.07)" },
  "En mantenimiento": { color: "#8e908f", bg: "rgba(142,144,143,0.07)" },
};

const DEFAULT = { color: "#8e908f", bg: "rgba(142,144,143,0.07)" };

interface MaquinaStatusDropdownProps {
  status: string;
  options: string[];
  onChange: (value: string) => void;
  saving?: boolean;
}

export default function MaquinaStatusDropdown({
  status,
  options,
  onChange,
  saving = false,
}: MaquinaStatusDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const cfg = STATUS_CONFIGS[status] ?? DEFAULT;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative inline-flex items-center">
      <button
        type="button"
        disabled={saving}
        onClick={() => !saving && setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="inline-flex min-h-[30px] items-center justify-between gap-1 rounded-[7px] px-2 shadow-[0_4px_10px_rgba(0,0,0,0.25)] disabled:cursor-default"
        style={{ border: `1px solid ${cfg.color}`, backgroundColor: cfg.bg }}
      >
        <span
          className="font-ibm-plex text-[14px] font-medium leading-none"
          style={{ color: cfg.color }}
        >
          {saving ? "..." : status}
        </span>
        <CaretRight size={8} color={cfg.color} weight="bold" aria-hidden />
      </button>

      {isOpen && (
        <ul
          role="listbox"
          className="absolute top-[calc(100%+6px)] left-0 z-50 flex flex-col gap-2 rounded-[7px] bg-white p-2 shadow-[0_4px_20px_rgba(0,0,0,0.18)]"
          style={{ minWidth: "110px" }}
        >
          {options.map((option) => {
            const ocfg = STATUS_CONFIGS[option] ?? DEFAULT;
            return (
              <li key={option} role="option" aria-selected={option === status}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(option);
                    setIsOpen(false);
                  }}
                  className="w-full flex min-h-[30px] items-center justify-center rounded-[7px] px-3 font-ibm-plex font-medium text-[12px] transition-opacity hover:opacity-80"
                  style={{
                    border: `1px solid ${ocfg.color}`,
                    backgroundColor: option === status ? ocfg.bg : "transparent",
                    color: ocfg.color,
                  }}
                >
                  {option}
                  {option === status && <CheckIcon size={15} />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
