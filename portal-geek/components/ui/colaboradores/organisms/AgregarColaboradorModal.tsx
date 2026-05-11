"use client";

import {
  RegistrarColaboradorForm,
  type ColaboradorApiRow,
} from "@/components/ui/colaboradores/organisms/RegistrarColaboradorForm";

interface Sucursal {
  id_sucursal: number;
  nombre_sucursal: string;
}

interface Rol {
  id_rol: number;
  nombre_rol: string;
}

interface AgregarColaboradorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (row: ColaboradorApiRow) => void;
  roles: Rol[];
  sucursales: Sucursal[];
}

export function AgregarColaboradorModal({
  isOpen,
  onClose,
  onCreated,
  roles,
  sucursales,
}: AgregarColaboradorModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      aria-hidden="true"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="agregar-colaborador-title"
        className="bg-white rounded-[12px] shadow-lg w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8e8e8]">
          <h2
            id="agregar-colaborador-title"
            className="text-[20px] font-medium text-[#1e1e1e] font-ibm-plex"
          >
            Agregar Colaborador
          </h2>
          <button
            onClick={onClose}
            aria-label="Cerrar modal"
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
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <RegistrarColaboradorForm
            roles={roles}
            sucursales={sucursales}
            onCreated={onCreated}
            onClose={onClose}
          />
        </div>
      </div>
    </div>
  );
}
