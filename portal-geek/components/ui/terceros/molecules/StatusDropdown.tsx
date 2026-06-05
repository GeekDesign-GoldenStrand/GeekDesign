"use client";

import { ChevronDownIcon } from "@/components/ui/atoms/icons";
import { Popover, PopoverItem } from "@/components/ui/primitives/Popover";
import type { TerceroStatus } from "@/types";

const STATUS_OPTIONS: TerceroStatus[] = ["Activo", "Inactivo", "Baneado"];

const TRIGGER_STYLES: Record<TerceroStatus, string> = {
  Activo: "bg-[rgba(0,200,83,0.07)] border-[#00c853] text-[#00c853]",
  Inactivo: "bg-[rgba(255,179,0,0.07)] border-[#ffb300] text-[#ffb300]",
  Baneado: "bg-[rgba(255,23,68,0.07)] border-[#ff1744] text-[#ff1744]",
};

interface StatusDropdownProps {
  status: TerceroStatus;
  onChange?: (status: TerceroStatus) => void;
}

export function StatusDropdown({ status, onChange }: StatusDropdownProps) {
  return (
    <Popover
      align="start"
      panelClassName="min-w-[140px]"
      trigger={
        <button
          type="button"
          className={`flex items-center justify-center gap-1 min-w-[84px] px-2 py-0.5 rounded-[7px] border text-[14px] font-medium shadow-[0px_4px_10px_0px_rgba(0,0,0,0.25)] transition-all ${TRIGGER_STYLES[status]}`}
        >
          {status}
          <ChevronDownIcon />
        </button>
      }
    >
      <div className="flex flex-col gap-1">
        {STATUS_OPTIONS.map((opt) => (
          <PopoverItem
            key={opt}
            selected={opt === status}
            onSelect={() => {
              if (opt !== status) onChange?.(opt);
            }}
          >
            {opt}
          </PopoverItem>
        ))}
      </div>
    </Popover>
  );
}
