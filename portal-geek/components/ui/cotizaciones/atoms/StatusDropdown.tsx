"use client";

import { CaretDown } from "@phosphor-icons/react";

import { Popover, PopoverItem } from "@/components/ui/primitives/Popover";
import type { EstatusCotizacion } from "@/types/cotizacion";

import { STATUS_COLORS } from "./constants";

interface StatusDropdownProps {
  current: EstatusCotizacion;
  /**
   * Actionable next statuses to surface. The parent owns the confirm + PATCH
   * flow — this atom just fires `onChange` with the picked option.
   */
  options: EstatusCotizacion[];
  onChange: (next: EstatusCotizacion) => void;
  disabled?: boolean;
}

/**
 * Cotización status picker. Trigger matches the colored pill used in the
 * cotizaciones table's StatusPill (rounded-full, per-status background +
 * caret), so a Direccion-tier admin recognises the same control on both
 * surfaces. The dropdown panel is the canonical Popover primitive — same
 * primitive `Select` is built on — so option rows render with the
 * standard hover / selected styling (plain text, no nested pills).
 */
export function StatusDropdown({ current, options, onChange, disabled }: StatusDropdownProps) {
  const isInteractive = !disabled && options.length > 0;
  const currentColor = STATUS_COLORS[current];
  // Match the cotizaciones table's StatusPill trigger chrome exactly so the
  // two controls read as the same component to the admin.
  const pillBase = `rounded-full pl-4 pr-3 py-1 text-sm font-medium ${currentColor}`;

  // No interactive state → render as an inert pill (no button, no caret).
  if (!isInteractive) {
    return (
      <span className={`inline-flex items-center whitespace-nowrap ${pillBase}`}>{current}</span>
    );
  }

  return (
    <Popover
      align="end"
      panelClassName="min-w-[160px]"
      trigger={
        <button
          type="button"
          aria-label="Cambiar estatus de la cotización"
          className={`inline-flex items-center gap-2 cursor-pointer hover:brightness-95 transition ${pillBase}`}
        >
          <span className="whitespace-nowrap">{current}</span>
          <CaretDown size={14} weight="bold" />
        </button>
      }
    >
      <div className="flex flex-col gap-1">
        {/* Surface the current status as a selected PopoverItem so the panel
            visually announces which value is active (matches the cotizaciones
            table's StatusPill). Filtered out of `options` below so we never
            render the same status twice if the parent included it. The
            PopoverItem primitive already short-circuits onSelect when
            selected → clicking the current row just closes the panel. */}
        <PopoverItem selected onSelect={() => {}}>
          {current}
        </PopoverItem>
        {options
          .filter((opt) => opt !== current)
          .map((opt) => (
            <PopoverItem key={opt} onSelect={() => onChange(opt)}>
              {opt}
            </PopoverItem>
          ))}
      </div>
    </Popover>
  );
}
