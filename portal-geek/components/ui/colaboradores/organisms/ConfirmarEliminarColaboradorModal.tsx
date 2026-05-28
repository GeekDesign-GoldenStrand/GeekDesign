"use client";

import { ConfirmDialog } from "@/components/ui/atoms";

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
  return (
    <ConfirmDialog
      isOpen={isOpen}
      title="Eliminar colaborador"
      loading={loading}
      error={serverError}
      onClose={onClose}
      onConfirm={onConfirm}
      description={
        <>
          ¿Está seguro de que desea eliminar a{" "}
          <span className="font-medium text-[#1e1e1e]">{colaboradorName}</span>? Su estatus cambiará
          a <span className="font-medium">Inactivo</span>.
        </>
      }
    />
  );
}
