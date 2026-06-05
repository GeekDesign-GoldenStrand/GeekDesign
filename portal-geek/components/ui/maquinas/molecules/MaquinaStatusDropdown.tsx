"use client";

import { CaretRight } from "@phosphor-icons/react/dist/ssr";

import { Popover, PopoverItem } from "@/components/ui/primitives/Popover";

const STATUS_CONFIGS: Record<string, { color: string; bg: string }> = {
  Activa: { color: "#00c853", bg: "rgba(105, 255, 168, 0.07)" },
  Inactiva: { color: "#ffb300", bg: "rgba(255,179,0,0.07)" },
  "En mantenimiento": { color: "#8e908f", bg: "rgba(142,144,143,0.07)" },
};

const DEFAULT = { color: "#8e908f", bg: "rgba(142,144,143,0.07)" };

interface MaquinaStatusDropdownProps {
  status: string;
  options: string[];
  onChange: (newStatus: string) => void;
  saving?: boolean;
}

export default function MaquinaStatusDropdown({
  status,
  options,
  onChange,
  saving = false,
}: MaquinaStatusDropdownProps) {
  const cfg = STATUS_CONFIGS[status] ?? DEFAULT;

  return (
    <Popover
      align="start"
      trigger={
        <button
          type="button"
          disabled={saving}
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
      }
    >
      <div className="flex flex-col gap-1">
        {options.map((option) => (
          <PopoverItem key={option} selected={option === status} onSelect={() => onChange(option)}>
            {option}
          </PopoverItem>
        ))}
      </div>
    </Popover>
  );
}
