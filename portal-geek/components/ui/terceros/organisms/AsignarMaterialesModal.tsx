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
      <div className="bg-white rounded-[20px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] w-full max-w-[500px] flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[rgba(228,0,124,0.02)]">
          <div>
            <h2 className="text-xl font-bold text-[#1e1e1e]">Asignar Materiales</h2>
            <p className="text-[14px] text-[#575757] mt-0.5">{companyName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-[#8e908f] hover:text-[#1e1e1e]"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-8 h-8 border-4 border-[#E4007C] border-t-transparent rounded-full animate-spin" />
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
                  activeColor="#E4007C"
                />
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-[14px] font-semibold text-[#575757] hover:bg-gray-100 rounded-[10px] transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="px-8 py-2.5 text-[14px] font-bold text-white bg-[#E4007C] hover:bg-[#c2006a] rounded-[10px] transition-all shadow-[0_4px_15px_rgba(228,0,124,0.3)] hover:shadow-[0_6px_20px_rgba(228,0,124,0.4)] active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            {saving ? "Guardando..." : "Asignar"}
          </button>
        </div>
      </div>
    </div>
  );
}
