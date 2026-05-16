"use client";

import { useEffect, useState } from "react";

import { MailIcon, PhoneIcon, UsersIcon, XIcon } from "@/components/ui/atoms/icons";
import type { MaterialProveedor } from "@/lib/services/materiales";

interface ProveedoresModalProps {
  isOpen: boolean;
  materialId: number | null;
  materialName: string;
  onClose: () => void;
}

function StatusBadge({ estatus }: { estatus: string }) {
  const colorMap: Record<string, string> = {
    Activo: "bg-[#d1fae5] text-[#065f46] border-[#6ee7b7]",
    Inactivo: "bg-[#f3f4f6] text-[#6b7280] border-[#d1d5db]",
    Baneado: "bg-[#fee2e2] text-[#991b1b] border-[#fca5a5]",
  };
  const classes = colorMap[estatus] ?? "bg-[#f3f4f6] text-[#6b7280] border-[#d1d5db]";

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-medium ${classes}`}
    >
      {estatus}
    </span>
  );
}

function ProveedorRow({ proveedor }: { proveedor: MaterialProveedor }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 bg-[#f8f8f8] rounded-[8px] border border-[#e8e8e8]">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-[14px] font-semibold text-[#1e1e1e] truncate">{proveedor.nombre}</p>
          <StatusBadge estatus={proveedor.estatus} />
        </div>
        <p className="text-[12px] text-[#575757] mt-0.5">{proveedor.tipo}</p>
        <p className="text-[12px] font-medium text-[#1e1e1e] mt-0.5">
          $
          {Number(proveedor.precio).toLocaleString("es-MX", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
      </div>

      <div className="flex flex-col gap-1 sm:items-end text-[12px] text-[#575757]">
        <span className="flex items-center gap-1">
          <PhoneIcon size={12} />
          {proveedor.telefono}
        </span>
        <span className="flex items-center gap-1">
          <MailIcon size={12} />
          {proveedor.correo}
        </span>
      </div>
    </div>
  );
}

export function ProveedoresModal({
  isOpen,
  materialId,
  materialName,
  onClose,
}: ProveedoresModalProps) {
  const [proveedores, setProveedores] = useState<MaterialProveedor[] | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const isLoading = proveedores === null && !fetchError;

  useEffect(() => {
    if (!isOpen || materialId === null) return;

    const abortController = new AbortController();

    fetch(`/api/materiales/${materialId}/proveedores`, { signal: abortController.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Error ${res.status}`);
        return res.json();
      })
      .then((payload) => {
        if (abortController.signal.aborted) return;
        setProveedores(payload.data as MaterialProveedor[]);
      })
      .catch(() => {
        if (abortController.signal.aborted) return;
        setFetchError("No se pudieron cargar los proveedores. Intenta de nuevo.");
      });

    return () => abortController.abort();
  }, [isOpen, materialId]);

  if (!isOpen || materialId === null) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      aria-hidden="true"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="proveedores-modal-title"
        className="bg-white rounded-[12px] shadow-lg w-full max-w-xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-[#e8e8e8]">
          <div className="flex items-center gap-2.5 min-w-0">
            <UsersIcon size={20} className="shrink-0 text-[#575757]" />
            <div className="min-w-0">
              <h2
                id="proveedores-modal-title"
                className="text-[17px] font-semibold text-[#1e1e1e] leading-tight"
              >
                Proveedores
              </h2>
              <p className="text-[13px] text-[#8e908f] truncate">{materialName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            className="ml-4 shrink-0 text-[#8e908f] hover:text-[#e42200] transition-colors"
          >
            <XIcon size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-2">
          {isLoading && <p className="text-[#8e908f] text-[14px]">Cargando proveedores...</p>}

          {fetchError && <p className="text-[#e42200] text-[14px]">{fetchError}</p>}

          {proveedores?.length === 0 && !fetchError && (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <UsersIcon size={32} className="text-[#c6c6c6]" />
              <p className="text-[14px] text-[#8e908f]">
                Este material no tiene proveedores registrados aún.
              </p>
            </div>
          )}

          {proveedores?.map((p) => (
            <ProveedorRow key={p.id} proveedor={p} />
          ))}
        </div>
      </div>
    </div>
  );
}
