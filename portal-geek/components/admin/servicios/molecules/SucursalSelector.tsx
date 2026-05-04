"use client";

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
      <label className="text-sm font-medium text-[#1e1e1e]">
        Sucursal: <span className="text-[#e42200]">*</span>
      </label>

      <select
        value={selectedId ?? ""}
        onChange={(e) => {
          const value = e.target.value;
          onChange(value === "" ? null : Number(value));
        }}
        disabled={disabled || opciones.length === 0}
        className="h-10 px-3 rounded-md border border-gray-300 bg-white text-[#1e1e1e] focus:outline-none focus:ring-2 focus:ring-[#e42200] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        <option value="">Selecciona una sucursal</option>
        {opciones.map((s) => (
          <option key={s.id_sucursal} value={s.id_sucursal}>
            {s.nombre_sucursal}
          </option>
        ))}
      </select>

      {opciones.length === 0 && (
        <p className="text-xs text-gray-500">No hay sucursales disponibles.</p>
      )}
    </div>
  );
}