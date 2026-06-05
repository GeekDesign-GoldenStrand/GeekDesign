"use client";

import { CaretRight } from "@phosphor-icons/react/dist/ssr";

import { Popover, PopoverItem } from "@/components/ui/primitives/Popover";

export type StatusValue = "Activo" | "Inactivo" | "Activa" | "Inactiva" | (string & {});

const STATUS_CONFIGS: Record<string, { color: string; bg: string }> = {
  Activo: { color: "#00c853", bg: "rgba(0,200,83,0.07)" },
  Inactivo: { color: "#ffb300", bg: "rgba(255,179,0,0.07)" },
  Activa: { color: "#00c853", bg: "rgba(0,200,83,0.07)" },
  Inactiva: { color: "#ffb300", bg: "rgba(255,179,0,0.07)" },
};

const DEFAULT = { color: "#8e908f", bg: "rgba(142,144,143,0.07)" };

const STATUSES: StatusValue[] = ["Activo", "Inactivo"];

interface StatusTagProps {
  status: string;
  onStatusChange?: (newStatus: string) => void;
  saving?: boolean;
}

export function StatusTag({ status, onStatusChange, saving }: StatusTagProps) {
  const cfg = STATUS_CONFIGS[status] ?? DEFAULT;
  const interactive = !!onStatusChange && !saving;

  const triggerButton = (
    <button
      type="button"
      disabled={!interactive}
      className="inline-flex min-h-[24px] items-center justify-between gap-1 rounded-[7px] px-2 shadow-[0_4px_10px_rgba(0,0,0,0.25)] disabled:cursor-default"
      style={{ minWidth: "98px", border: `1px solid ${cfg.color}`, backgroundColor: cfg.bg }}
    >
      <span
        className="font-ibm-plex text-[14px] font-medium leading-none"
        style={{ color: cfg.color }}
      >
        {saving ? "..." : status}
      </span>
      <CaretRight size={8} color={cfg.color} weight="bold" aria-hidden />
    </button>
  );

  // Non-interactive mode renders just the static pill (no dropdown).
  if (!interactive) return triggerButton;

  return (
    <Popover align="start" panelClassName="min-w-[140px]" trigger={triggerButton}>
      <div className="flex flex-col gap-1">
        {STATUSES.map((s) => (
          <PopoverItem key={s} selected={s === status} onSelect={() => onStatusChange?.(s)}>
            {s}
          </PopoverItem>
        ))}
      </div>
    </Popover>
  );
}
