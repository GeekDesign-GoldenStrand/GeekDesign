"use client";

import { useEffect, useState } from "react";

import { TerceroTypeTag } from "../atoms/TerceroTypeTag";
import { AsignacionCard } from "../molecules/AsignacionCard";

interface AsignarMaterialesModalProps {
  id_proveedor: number;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function AsignarMaterialesModal({
  id_proveedor,
  companyName,
  contactName,
  email,
  phone,
  role,
  status,
  isOpen,
  onClose,
  onSaved,
}: AsignarMaterialesModalProps) {
  const [items, setItems] = useState<
    { id_material: number; nombre_material: string; descripcion_material: string | null }[]
  >([]);
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
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
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
        window.alert("Materiales asignados correctamente");
        onSaved();
        onClose();
      } else {
        window.alert("Hubo un error al guardar la asignación");
      }
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[12px] shadow-lg w-full max-w-[550px] flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between px-6 py-4 border-b border-[#e8e8e8]">
          <div className="flex flex-col gap-4 w-full">
            <div className="flex justify-between items-center">
              <h2 className="text-[20px] font-medium text-[#1e1e1e]">Asignar Materiales</h2>
            </div>

            <div className="h-px bg-[#e8e8e8] w-full" />

            <div className="space-y-1">
              <h3 className="text-[22px] font-semibold text-[#1e1e1e] leading-tight">
                {companyName}
              </h3>
              <p className="text-[18px] font-medium text-[#1e1e1e]">{contactName}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[17px] font-medium text-[#575757]">
                <span className="underline decoration-gray-300">{email}</span>
                <span>{phone}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-1">
              <span
                className={`px-2 py-0.5 rounded-[7px] border text-[14px] font-medium shadow-[0px_4px_10px_0px_rgba(0,0,0,0.25)] ${
                  role === "Proveedor"
                    ? "bg-[rgba(139,92,246,0.12)] border-[#8b5cf6] text-[#8b5cf6]"
                    : "bg-[rgba(0,128,255,0.07)] border-[#006aff] text-[#006aff]"
                }`}
              >
                {role}
              </span>
              <TerceroTypeTag type="Material" />
              <span
                className={`px-2 py-0.5 rounded-[7px] border text-[14px] font-medium shadow-[0px_4px_10px_0px_rgba(0,0,0,0.25)] ${
                  status === "Activo"
                    ? "bg-[rgba(0,200,83,0.07)] border-[#00c853] text-[#00c853]"
                    : status === "Inactivo"
                      ? "bg-[rgba(255,179,0,0.07)] border-[#ffb300] text-[#ffb300]"
                      : "bg-[rgba(255,23,68,0.07)] border-[#ff1744] text-[#ff1744]"
                }`}
              >
                {status}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#8e908f] hover:text-[#e42200] transition-colors pt-1"
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
                  description={item.descripcion_material ?? undefined}
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
