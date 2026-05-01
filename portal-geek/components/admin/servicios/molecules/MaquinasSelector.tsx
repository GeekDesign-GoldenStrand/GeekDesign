"use client";

import { useState } from "react";

import { Icon } from "../atoms/Icon";
import { XIcon } from "@phosphor-icons/react";

import type { MaquinaOption } from "@/types/servicios";

type MaquinasSelectorProps = {
  // Complete list of machines, coming directly from the main fetch.
  opciones: MaquinaOption[];
  // IDs from the already selected machines.
  selectedIds: number[];
  // Callback when the selection changes.
  onChange: (ids: number[]) => void;
};

export function MaquinasSelector({
  opciones,
  selectedIds,
  onChange,
}: MaquinasSelectorProps) {
  // Dropdonw state
  const [open, setOpen] = useState(false);

  // Selected Machines
  const selected = opciones.filter((m) =>
    selectedIds.includes(m.id_maquina)
  );

  // Available machines to select 
  const available = opciones.filter(
    (m) => !selectedIds.includes(m.id_maquina)
  );

  // With a handler you add a machine to the array of selected IDs and close the dropdown.
  const handleAdd = (id: number) => {
    onChange([...selectedIds, id]);
    setOpen(false);
  };

  
  const handleRemove = (id: number) => {
    onChange(selectedIds.filter((selectedId) => selectedId !== id));
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-[#1e1e1e]">Máquina(s)</label>

      {/* Selected Machines */}
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

      {/* Add machine button, with dropdown */}
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={available.length === 0}
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
                {m.apodo_maquina} 
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

      {/* Informative message when all machines are already selected */}
      {available.length === 0 && selected.length > 0 && (
        <p className="text-xs text-gray-500">
          Todas las máquinas disponibles ya están agregadas.
        </p>
      )}
    </div>
  );
}