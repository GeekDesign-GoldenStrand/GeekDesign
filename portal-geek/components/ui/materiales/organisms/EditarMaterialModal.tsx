"use client";

import { useEffect, useState } from "react";

import { Modal } from "@/components/ui/atoms";
import { EditarMaterialForm } from "@/components/ui/materiales/organisms/EditarMaterialForm";
import { mapMaterialRow, type MaterialApiRow } from "@/lib/utils/materiales";
import type { MaterialCardProps } from "@/types";

interface EditarMaterialModalProps {
  isOpen: boolean;
  // Only the ID is received; fresh data is fetched on open to avoid stale edits.
  materialId: number | null;
  onClose: () => void;
  onUpdated: (row: MaterialCardProps) => void;
  onDeleted: (materialId: number) => void;
}

export function EditarMaterialModal({
  isOpen,
  materialId,
  onClose,
  onUpdated,
  onDeleted,
}: EditarMaterialModalProps) {
  const [freshMaterial, setFreshMaterial] = useState<MaterialCardProps | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Re-fetch from the server each time the modal opens so the form always
  // reflects the current DB state, not a potentially stale in-memory row.
  useEffect(() => {
    if (!isOpen || materialId === null) {
      return;
    }

    const abortController = new AbortController();

    fetch(`/api/materiales/${materialId}`, { signal: abortController.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Error ${res.status}`);
        return res.json();
      })
      .then((payload) => {
        if (abortController.signal.aborted) return;
        setFreshMaterial(mapMaterialRow(payload.data as MaterialApiRow));
      })
      .catch(() => {
        if (abortController.signal.aborted) return;
        setFetchError("No se pudo cargar el material. Intenta de nuevo.");
      });

    return () => {
      abortController.abort();
    };
  }, [isOpen, materialId]);

  if (!isOpen || materialId === null) return null;

  const isLoading = !freshMaterial && !fetchError;

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={freshMaterial?.tipo === "grupo" ? "Editar Grupo de Material" : "Editar Material"}
      size="2xl"
      closeOnBackdropClick={false}
    >
      {isLoading && <p className="text-[#8e908f] text-[14px]">Cargando datos del material...</p>}

      {fetchError && (
        <p role="alert" className="text-[#e42200] text-[14px]">
          {fetchError}
        </p>
      )}

      {!isLoading && !fetchError && freshMaterial && (
        <EditarMaterialForm
          material={freshMaterial}
          onUpdated={onUpdated}
          onDeleted={onDeleted}
          onClose={onClose}
        />
      )}
    </Modal>
  );
}
