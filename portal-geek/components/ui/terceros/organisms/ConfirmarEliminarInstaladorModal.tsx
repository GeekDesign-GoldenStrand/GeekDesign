"use client";

import { ModalShell } from "@/components/ui/terceros/molecules/ModalShell";

interface ConfirmarEliminarInstaladorModalProps {
  isOpen: boolean;
  instaladorName: string;
  loading: boolean;
  serverError: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmarEliminarInstaladorModal({
  isOpen,
  instaladorName,
  loading,
  serverError,
  onClose,
  onConfirm,
}: ConfirmarEliminarInstaladorModalProps) {
  if (!isOpen) return null;

  return (
    <ModalShell title="Eliminar instalador" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <p className="text-[14px] text-[#575757]">
          ¿Está seguro de que desea eliminar a{" "}
          <span className="font-medium text-[#1e1e1e]">{instaladorName}</span>? Su estatus cambiará
          a <span className="font-medium">Inactivo</span>.
        </p>

        {serverError && (
          <div className="rounded-[6px] bg-[#ffecec] border border-[#e42200] text-[#e42200] text-[13px] px-4 py-2">
            {serverError}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2 text-[14px] font-medium text-[#575757] border border-[#b9b8b8] rounded-[7px] hover:bg-[#f5f5f5] transition-colors disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-5 py-2 text-[14px] font-medium text-white bg-[#e42200] rounded-[7px] hover:bg-[#c01b00] transition-colors disabled:opacity-60"
          >
            {loading ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
