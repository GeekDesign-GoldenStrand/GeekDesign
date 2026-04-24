"use client";

import { useEffect, useState } from "react";
import { AsignacionCard } from "../molecules/AsignacionCard";

interface AsignarMaterialesModalProps {
  id_proveedor: number;
  companyName: string;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function AsignarMaterialesModal({
  id_proveedor,
  companyName,
  isOpen,
  onClose,
  onSaved,
}: AsignarMaterialesModalProps) {
  const [items, setItems] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    Promise.all([
      fetch("/api/materiales?pageSize=100").then((r) => r.json()),
      fetch(`/api/proveedores/${id_proveedor}/asignacion`).then((r) => r.json()),
    ])
      .then(([allRes, currentRes]) => {
        setItems(allRes.data ?? []);
        setSelectedIds(currentRes.data?.materialIds ?? []);
      })
      .finally(() => setLoading(false));
  }, [isOpen, id_proveedor]);

  function toggleId(id: number) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/proveedores/${id_proveedor}/asignacion`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "material", ids: selectedIds }),
      });
      if (res.ok) {
        onSaved();
        onClose();
      } else {
        alert("Error al guardar la asignación");
      }
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[12px] shadow-lg w-full max-w-[500px] flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8e8e8]">
          <div>
            <h2 className="text-[20px] font-medium text-[#1e1e1e]">Asignar Materiales</h2>
            <p className="text-[13px] text-[#575757] mt-0.5">{companyName}</p>
          </div>
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

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-8 h-8 border-4 border-[#006aff] border-t-transparent rounded-full animate-spin" />
              <p className="text-[14px] text-[#8e908f] font-medium">Cargando materiales...</p>
            </div>
          ) : items.length === 0 ? (
            <p className="text-center py-12 text-[#8e908f]">No hay materiales disponibles.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {items.map((item) => (
                <AsignacionCard
                  key={item.id_material}
                  id={item.id_material}
                  name={item.nombre_material}
                  description={item.descripcion_material}
                  selected={selectedIds.includes(item.id_material)}
                  onToggle={() => toggleId(item.id_material)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-[#e8e8e8] flex justify-end gap-3 bg-gray-50/30">
          <button
            onClick={onClose}
            className="px-5 py-2 text-[14px] font-medium text-[#575757] border border-[#b9b8b8] rounded-[7px] hover:bg-[#f5f5f5] transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="px-5 py-2 text-[14px] font-medium text-white bg-[#006aff] hover:bg-[#0056ce] rounded-[7px] transition-all shadow-[0_4px_12px_rgba(0,106,255,0.15)] disabled:opacity-50 disabled:pointer-events-none"
          >
            {saving ? "Guardando..." : "Asignar"}
          </button>
        </div>
      </div>
    </div>
  );
}
