"use client";

import { X } from "@phosphor-icons/react";

import { RegistrarTerceroForm } from "@/components/ui/terceros/organisms/RegistrarTerceroForm";
import type { TerceroCardProps } from "@/types";

interface AgregarTerceroModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (row: TerceroCardProps) => void;
  initialType?: "Proveedor" | "Instalador";
}

export function AgregarTerceroModal({
  isOpen,
  onClose,
  onCreated,
  initialType = "Proveedor",
}: AgregarTerceroModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[12px] shadow-lg w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8e8e8]">
          <h2 className="text-[20px] font-medium text-[#1e1e1e]">Agregar Registro</h2>
          <button
            onClick={onClose}
            className="text-[#8e908f] hover:text-[#e42200] transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          <RegistrarTerceroForm onCreated={onCreated} onClose={onClose} initialType={initialType} />
        </div>
      </div>
    </div>
  );
}
