"use client";

import { CaretDown } from "@phosphor-icons/react";

import { Popover, PopoverItem } from "@/components/ui/primitives/Popover";
import { STATUS_STYLES } from "@/lib/constants/statusColors";

interface Props {
  status: "Activo" | "Inactivo";
  onChange?: (value: "Activo" | "Inactivo") => void;
}

const OPTIONS: Array<"Activo" | "Inactivo"> = ["Activo", "Inactivo"];

// Branch status selector. Trigger keeps the colored badge chrome for
// at-a-glance status; open panel is the canonical PopoverItem (uniform with
// every other dropdown in the app).
export function StatusBadge({ status, onChange }: Props) {
  const style = STATUS_STYLES.sucursal[status];

  return (
    <Popover
      align="start"
      panelClassName="min-w-[140px]"
      trigger={
        <button
          type="button"
          className="inline-flex items-center justify-between gap-2 px-4 py-2 rounded-xl border-2 font-medium outline-none cursor-pointer"
          style={{
            background: style.background,
            borderColor: style.border,
            color: style.text,
          }}
        >
          <span>{status}</span>
          <CaretDown size={14} weight="bold" />
        </button>
      }
    >
      <div className="flex flex-col gap-1">
        {OPTIONS.map((opt) => (
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
