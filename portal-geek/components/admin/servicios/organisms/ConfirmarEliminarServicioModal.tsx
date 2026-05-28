"use client";

import { ConfirmDialog } from "@/components/ui/atoms";

interface ConfirmarEliminarServicioModalProps {
  isOpen: boolean;
  servicioNombre: string;
  loading: boolean;
  serverError: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmarEliminarServicioModal({
  isOpen,
  servicioNombre,
  loading,
  serverError,
  onClose,
  onConfirm,
}: ConfirmarEliminarServicioModalProps) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      title="Eliminar servicio"
      loading={loading}
      error={serverError}
      onClose={onClose}
      onConfirm={onConfirm}
      description={
        <>
          ¿Está seguro de que desea eliminar el servicio{" "}
          <span className="font-medium text-[#1e1e1e]">{servicioNombre}</span>? Su estatus cambiará
          a <span className="font-medium">Inactivo</span>.
        </>
      }
    />
  );
}
