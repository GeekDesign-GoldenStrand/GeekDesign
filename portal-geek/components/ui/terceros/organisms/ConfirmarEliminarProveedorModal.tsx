"use client";

import { ConfirmDialog } from "@/components/ui/atoms";

interface ConfirmarEliminarProveedorModalProps {
  isOpen: boolean;
  proveedorName: string;
  loading: boolean;
  serverError: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmarEliminarProveedorModal({
  isOpen,
  proveedorName,
  loading,
  serverError,
  onClose,
  onConfirm,
}: ConfirmarEliminarProveedorModalProps) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      title="Eliminar proveedor"
      loading={loading}
      error={serverError}
      onClose={onClose}
      onConfirm={onConfirm}
      description={
        <>
          ¿Está seguro de que desea eliminar a{" "}
          <span className="font-medium text-[#1e1e1e]">{proveedorName}</span>? Su estatus cambiará a{" "}
          <span className="font-medium">Inactivo</span>.
        </>
      }
    />
  );
}
