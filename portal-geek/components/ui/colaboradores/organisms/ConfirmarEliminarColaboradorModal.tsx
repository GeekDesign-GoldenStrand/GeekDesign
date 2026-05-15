"use client";

interface ConfirmarEliminarColaboradorModalProps {
  isOpen: boolean;
  colaboradorName: string;
  loading: boolean;
  serverError: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmarEliminarColaboradorModal({
  isOpen,
  colaboradorName,
  loading,
  serverError,
  onClose,
  onConfirm,
}: ConfirmarEliminarColaboradorModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-[12px] shadow-lg w-full max-w-lg overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8e8e8]">
          <h2 className="text-[20px] font-medium text-[#1e1e1e]">Eliminar colaborador</h2>
          <button
            type="button"
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
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          <p className="text-[14px] text-[#575757]">
            ¿Está seguro de que desea eliminar a{" "}
            <span className="font-medium text-[#1e1e1e]">{colaboradorName}</span>? Su estatus
            cambiará a <span className="font-medium">Inactivo</span>.
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
      </div>
    </div>
  );
}
