"use client";

import { EditarMaterialForm } from "@/components/ui/materiales/organisms/EditarMaterialForm";
import type { MaterialCardProps } from "@/types";

interface EditarMaterialModalProps {
  isOpen: boolean;
  material: MaterialCardProps | null;
  onClose: () => void;
  onUpdated: (row: MaterialCardProps) => void;
  onDeleted: (materialId: number) => void;
}

export function EditarMaterialModal({
  isOpen,
  material,
  onClose,
  onUpdated,
  onDeleted,
}: EditarMaterialModalProps) {
  if (!isOpen || !material) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-[12px] shadow-lg w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8e8e8]">
          <h2 className="text-[20px] font-medium text-[#1e1e1e]">Editar Material</h2>
          <button
            onClick={onClose}
            className="text-[#8e908f] hover:text-[#e42200] transition-colors"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <EditarMaterialForm
            material={material}
            onUpdated={onUpdated}
            onDeleted={onDeleted}
            onClose={onClose}
          />
        </div>
      </div>
    </div>
  );
}
