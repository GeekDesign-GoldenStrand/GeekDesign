"use client";

import { useState } from "react";

import { Modal } from "@/components/ui/atoms";
import { Button } from "@/components/ui/atoms/Button";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: { nombre?: string; direccion?: string; estatus?: string[] }) => void;
}

export function SucursalesFilterModal({ isOpen, onClose, onApply }: Props) {
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [estatus, setEstatus] = useState<string[]>([]);

  function toggleEstatus(value: string) {
    setEstatus((prev) =>
      prev.includes(value) ? prev.filter((e) => e !== value) : [...prev, value]
    );
  }

  function handleApply() {
    onApply({ nombre, direccion, estatus });
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Filtrar sucursales" size="md">
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-semibold">Nombre</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full border rounded px-2 py-1"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold">Dirección</label>
          <input
            type="text"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            className="w-full border rounded px-2 py-1"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold">Estatus</label>
          <div className="flex gap-3">
            {["Activo", "Inactivo"].map((e) => (
              <label key={e} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={estatus.includes(e)}
                  onChange={() => toggleEstatus(e)}
                />
                {e}
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" variant="primary" size="sm" onClick={handleApply}>
            Aplicar filtros
          </Button>
        </div>
      </div>
    </Modal>
  );
}
