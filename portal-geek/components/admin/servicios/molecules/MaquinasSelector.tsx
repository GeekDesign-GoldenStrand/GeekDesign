"use client";

import { XIcon } from "@phosphor-icons/react";
import { useState } from "react";

import type { MaquinaOption } from "@/types/servicios";

import { Icon } from "../atoms/Icon";

type MaquinasSelectorProps = {
  // List of machines AVAILABLE for the currently selected branch.
  // Empty array if no branch is selected or if the branch has no machines.
  opciones: MaquinaOption[];
  // IDs of the already selected machines.
  selectedIds: number[];

  onChange: (ids: number[]) => void;
  // Whether the parent has already selected a branch. Drives the disabled state.
  hasSucursal: boolean;
  // Whether machines are still being loaded for the selected branch.
  loading?: boolean;
};

export function MaquinasSelector({
  opciones,
  selectedIds,
  onChange,
  hasSucursal,
  loading = false,
}: MaquinasSelectorProps) {
  // Dropdown state
  const [open, setOpen] = useState(false);

  const selected = opciones.filter((m) => selectedIds.includes(m.id_maquina));

  const available = opciones.filter((m) => !selectedIds.includes(m.id_maquina));

  // Handler to add a machine to the selection.
  const handleAdd = (id: number) => {
    onChange([...selectedIds, id]);
    setOpen(false);
  };

  const handleRemove = (id: number) => {
    onChange(selectedIds.filter((selectedId) => selectedId !== id));
  };

  // The button is disabled if there's no branch, no available machines, or while loading.
  const buttonDisabled = !hasSucursal || loading || available.length === 0;

  // Helper to compute the button's hint text based on state.
  const buttonHint = (() => {
    if (!hasSucursal) return "Selecciona una sucursal primero";
    if (loading) return "Cargando máquinas...";
    if (opciones.length === 0) return "Esta sucursal no tiene máquinas asignadas";
    if (available.length === 0) return "Todas las máquinas ya están agregadas";
    return null;
  })();

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-[#1e1e1e]">Máquina(s):</label>

      {/* Selected machines as removable chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((maquina) => (
            <div
              key={maquina.id_maquina}
              className="inline-flex items-center gap-2 bg-[#fce4e4] text-[#e42200] px-3 py-1.5 rounded-full text-sm font-medium"
            >
              {maquina.apodo_maquina}
              <button
                type="button"
                onClick={() => handleRemove(maquina.id_maquina)}
                className="hover:bg-[#e42200]/20 rounded-full p-0.5 transition-colors"
                aria-label={`Quitar ${maquina.apodo_maquina}`}
              >
                <Icon LibIcon={XIcon} size={14} weight="bold" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add machine button or open dropdown */}
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={buttonDisabled}
          className="bg-[#e42200] text-white hover:bg-[#c41e00] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] h-10 px-5 rounded-full font-medium text-sm transition-all self-start disabled:opacity-50 disabled:cursor-not-allowed"
        >
          + Agregar Máquina
        </button>
      ) : (
        <div className="flex gap-2">
          <select
            autoFocus
            onChange={(e) => {
              const id = Number(e.target.value);
              if (id) handleAdd(id);
            }}
            className="h-10 px-3 rounded-md border border-gray-300 bg-white text-[#1e1e1e] focus:outline-none focus:ring-2 focus:ring-[#e42200] focus:border-transparent flex-1"
          >
            <option value="">Selecciona una máquina...</option>
            {available.map((m) => (
              <option key={m.id_maquina} value={m.id_maquina}>
                {m.apodo_maquina} ({m.tipo})
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="bg-white text-[#1e1e1e] hover:bg-gray-100 border border-gray-300 h-10 px-4 rounded-md font-medium text-sm transition-all"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Single hint line that adapts to current state */}
      {buttonHint && <p className="text-xs text-gray-500">{buttonHint}</p>}
    </div>
  );
}
