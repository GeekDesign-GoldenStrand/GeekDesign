"use client";

import { CaretRight } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useRef, useState } from "react";

export type StatusValue = "Activo" | "Inactivo" | (string & {});

const STATUS_CONFIGS: Record<string, { color: string; bg: string }> = {
  Activo: { color: "#ff0000", bg: "rgba(255,0,0,0.07)" },
  Inactivo: { color: "#090909", bg: "rgba(0,0,0,0.07)" },
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
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const interactive = !!onStatusChange && !saving;

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-flex items-center">
      <button
        type="button"
        disabled={!interactive}
        onClick={() => interactive && setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex h-[24px] items-center justify-between gap-1 rounded-[7px] px-2 shadow-[0_4px_10px_rgba(0,0,0,0.25)] disabled:cursor-default"
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

      {open && (
        <ul
          role="listbox"
          className="absolute top-[calc(100%+6px)] left-0 z-50 flex flex-col gap-2 rounded-[7px] bg-white p-2 shadow-[0_4px_20px_rgba(0,0,0,0.18)]"
          style={{ minWidth: "110px" }}
        >
          {STATUSES.map((s) => {
            const scfg = STATUS_CONFIGS[s] ?? DEFAULT;
            return (
              <li key={s} role="option" aria-selected={s === status}>
                <button
                  type="button"
                  onClick={() => {
                    onStatusChange!(s);
                    setOpen(false);
                  }}
                  className="w-full flex h-[28px] items-center justify-center rounded-[7px] px-3 font-ibm-plex font-medium text-[12px] transition-opacity hover:opacity-80"
                  style={{
                    border: `1px solid ${scfg.color}`,
                    backgroundColor: s === status ? scfg.bg : "transparent",
                    color: scfg.color,
                  }}
                >
                  {s}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
