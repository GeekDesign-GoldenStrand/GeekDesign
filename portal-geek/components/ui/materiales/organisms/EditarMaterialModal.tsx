"use client";

import { useEffect, useState } from "react";

import { EditarMaterialForm } from "@/components/ui/materiales/organisms/EditarMaterialForm";
import type { MaterialCardProps } from "@/types";

// Raw shape returned by GET /api/materiales/:id
type FreshMaterial = {
  id_material: number;
  nombre_material: string;
  descripcion_material: string | null;
  unidad_medida: string;
  ancho: string | number | null;
  alto: string | number | null;
  grosor: string | number | null;
  color: string | null;
  imagen_url: string | null;
};

function mapFreshMaterial(item: FreshMaterial): MaterialCardProps {
  const normalize = (v: string | number | null) => (v == null || v === "" ? "-" : String(v));
  return {
    id: item.id_material,
    name: item.nombre_material,
    unit: item.unidad_medida,
    color: item.color ?? "-",
    width: normalize(item.ancho),
    height: normalize(item.alto),
    thickness: normalize(item.grosor),
    description: item.descripcion_material ?? "",
    imageUrl: item.imagen_url ?? "",
  };
}

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
        setFreshMaterial(mapFreshMaterial(payload.data as FreshMaterial));
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-[12px] shadow-lg w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8e8e8]">
          <h2 className="text-[20px] font-medium text-[#1e1e1e]">Editar Material</h2>
          <button
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
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {isLoading && (
            <p className="text-[#8e908f] text-[14px]">Cargando datos del material...</p>
          )}

          {fetchError && <p className="text-[#e42200] text-[14px]">{fetchError}</p>}

          {!isLoading && !fetchError && freshMaterial && (
            <EditarMaterialForm
              material={freshMaterial}
              onUpdated={onUpdated}
              onDeleted={onDeleted}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </div>
  );
}
