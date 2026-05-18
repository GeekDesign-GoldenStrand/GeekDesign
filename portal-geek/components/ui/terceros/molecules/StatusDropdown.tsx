"use client";

import { useEffect, useRef, useState } from "react";

import { ChevronDownIcon, CheckIcon } from "@/components/ui/atoms/icons";
import type { TerceroStatus } from "@/types";

const STATUS_OPTIONS: TerceroStatus[] = ["Activo", "Inactivo", "Baneado"];

interface StatusDropdownProps {
  status: TerceroStatus;
  onChange?: (status: TerceroStatus) => void;
}

export function StatusDropdown({ status, onChange }: StatusDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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

  function handleSelect(option: TerceroStatus) {
    setOpen(false);
    if (option !== status) onChange?.(option);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1 px-2 py-0.5 rounded-[7px] border text-[14px] font-medium shadow-[0px_4px_10px_0px_rgba(0,0,0,0.25)] transition-all ${
          status === "Activo"
            ? "bg-[rgba(0,200,83,0.07)] border-[#00c853] text-[#00c853]"
            : status === "Inactivo"
              ? "bg-[rgba(255,179,0,0.07)] border-[#ffb300] text-[#ffb300]"
              : "bg-[rgba(255,23,68,0.07)] border-[#ff1744] text-[#ff1744]"
        }`}
      >
        {status}
        <span className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`}>
          <ChevronDownIcon />
        </span>
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 min-w-[110px] bg-white rounded-[7px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.18)] border border-gray-100 overflow-hidden">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => handleSelect(opt)}
              className={`w-full text-left px-3 py-2 text-[14px] font-medium hover:bg-gray-50 flex items-center gap-2 ${
                opt === status ? "opacity-50 cursor-default" : ""
              } ${
                opt === "Activo"
                  ? "text-[#00c853]"
                  : opt === "Inactivo"
                    ? "text-[#ffb300]"
                    : "text-[#ff1744]"
              }`}
            >
              {opt}
              {opt === status && <CheckIcon />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
