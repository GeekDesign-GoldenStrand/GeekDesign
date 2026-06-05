"use client";

import { ConfirmDialog } from "@/components/ui/atoms";

interface ConfirmDeletionModalProps {
  modalTitle: string;
  deletedName: string;
  isOpen: boolean;
  loading: boolean;
  serverError: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ConfirmDeletionModal({
  modalTitle,
  deletedName,
  isOpen,
  loading,
  serverError,
  onClose,
  onConfirm,
}: ConfirmDeletionModalProps) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      title={modalTitle}
      loading={loading}
      error={serverError}
      onClose={onClose}
      onConfirm={onConfirm}
      description={
        <>
          ¿Está seguro de que desea eliminar{" "}
          <span className="font-medium text-[#1e1e1e]">{deletedName}</span>? Su estatus cambiará a{" "}
          <span className="font-medium">Inactivo</span>.
        </>
      }
    />
  );
}
