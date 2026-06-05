"use client";

import { ConfirmDialog } from "@/components/ui/atoms";

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
  return (
    <ConfirmDialog
      isOpen={isOpen}
      title="Eliminar instalador"
      loading={loading}
      error={serverError}
      onClose={onClose}
      onConfirm={onConfirm}
      description={
        <>
          ¿Está seguro de que desea eliminar a{" "}
          <span className="font-medium text-[#1e1e1e]">{instaladorName}</span>? Su estatus cambiará
          a <span className="font-medium">Inactivo</span>.
        </>
      }
    />
  );
}
