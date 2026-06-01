"use client";

import { Modal } from "@/components/ui/atoms";
import { RegistrarMaterialForm } from "@/components/ui/materiales/organisms/RegistrarMaterialForm";
import type { MaterialCardProps } from "@/types";

type Tipo = "individual" | "grupo" | "sub";

interface AgregarMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (row: MaterialCardProps) => void;
  initialTipo?: Tipo;
  initialPadreId?: number;
}

const TITLES: Record<Tipo, string> = {
  individual: "Agregar Material",
  grupo: "Crear Grupo de Materiales",
  sub: "Agregar Variante",
};

export function AgregarMaterialModal({
  isOpen,
  onClose,
  onCreated,
  initialTipo = "individual",
  initialPadreId,
}: AgregarMaterialModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={TITLES[initialTipo]}
      size="2xl"
      closeOnBackdropClick={false}
    >
      <RegistrarMaterialForm
        onCreated={onCreated}
        onClose={onClose}
        initialTipo={initialTipo}
        initialPadreId={initialPadreId}
      />
    </Modal>
  );
}
