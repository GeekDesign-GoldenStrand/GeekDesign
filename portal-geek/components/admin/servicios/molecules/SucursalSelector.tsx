"use client";

import { Select, SelectOption } from "@/components/ui/atoms/Select";
import type { SucursalOption } from "@/types/servicios";

type SucursalSelectorProps = {
  // Active branches available for the service.
  opciones: SucursalOption[];
  // Currently selected branch ID, or null if none chosen yet.
  selectedId: number | null;
  // Callback when the admin picks a different branch.
  onChange: (id: number | null) => void;
  // Disabled state — used while form is submitting.
  disabled?: boolean;
};

export function SucursalSelector({
  opciones,
  selectedId,
  onChange,
  disabled = false,
}: SucursalSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-base font-bold text-[#1e1e1e]">
        Sucursal: <span className="text-[#e42200]">*</span>
      </label>

      <Select
        value={selectedId === null ? "" : String(selectedId)}
        onChange={(v) => onChange(v === "" ? null : Number(v))}
        placeholder="Selecciona una sucursal"
        size="md"
        disabled={disabled || opciones.length === 0}
      >
        {opciones.map((s) => (
          <SelectOption key={s.id_sucursal} value={String(s.id_sucursal)}>
            {s.nombre_sucursal}
          </SelectOption>
        ))}
      </Select>

      {opciones.length === 0 && (
        <p className="text-sm text-gray-500">No hay sucursales disponibles.</p>
      )}
    </div>
  );
}
