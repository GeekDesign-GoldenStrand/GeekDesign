"use client";

import { Modal } from "@/components/ui/atoms";
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
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Agregar Registro" size="lg">
      <RegistrarTerceroForm onCreated={onCreated} onClose={onClose} initialType={initialType} />
    </Modal>
  );
}
