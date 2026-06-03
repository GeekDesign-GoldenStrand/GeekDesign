"use client";

import { Modal } from "@/components/ui/atoms";
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
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Agregar Colaborador" size="lg">
      <RegistrarColaboradorForm
        roles={roles}
        sucursales={sucursales}
        onCreated={onCreated}
        onClose={onClose}
      />
    </Modal>
  );
}
