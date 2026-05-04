"use client";

import { XIcon } from "@phosphor-icons/react";
import { useState } from "react";

export type DateFilterOption = "this_month" | "this_week" | "expired" | "";

export interface Filters {
  fecha_creacion: DateFilterOption;
  entrega_estimada: DateFilterOption;
  monto_min: string;
  monto_max: string;
  empresa: string;
  cliente: string;
  folio: string;
  estatus: string;
}

export const defaultFilters: Filters = {
  fecha_creacion: "",
  entrega_estimada: "",
  monto_min: "",
  monto_max: "",
  empresa: "",
  cliente: "",
  folio: "",
  estatus: "",
};

interface CotizacionFilterProps {
  open: boolean;
  onClose: () => void;
  onApply: (filters: Filters) => void;
  onReset: () => void;
}

const DATE_OPTIONS: { label: string; value: DateFilterOption }[] = [
  { label: "Este mes", value: "this_month" },
  { label: "Esta semana", value: "this_week" },
  { label: "Vencidas", value: "expired" },
];

const ESTATUS_OPTIONS = ["En revisión", "Validada", "Aprobada", "Rechazada", "Cancelada"];

function DateToggle({
  value,
  onChange,
}: {
  value: DateFilterOption;
  onChange: (v: DateFilterOption) => void;
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {DATE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(value === opt.value ? "" : opt.value)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
            value === opt.value
              ? "bg-[#e42200] border-[#e42200] text-white"
              : "bg-white border-gray-300 text-gray-600 hover:border-[#e42200] hover:text-[#e42200]"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default function CotizacionFilter({
  open,
  onClose,
  onApply,
  onReset,
}: CotizacionFilterProps) {
  const [filters, setFilters] = useState<Filters>(defaultFilters);

  const set = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const handleReset = () => {
    setFilters(defaultFilters);
    onReset();
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-[420px] bg-white shadow-2xl z-50 flex flex-col font-['IBM_Plex_Sans_JP',sans-serif]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Filtros</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
            <XIcon size={22} />
          </button>
        </div>

        {/* Filters */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Fecha de Creación */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Fecha de Creación
            </label>
            <DateToggle value={filters.fecha_creacion} onChange={(v) => set("fecha_creacion", v)} />
          </div>

          {/* Entrega Estimada */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Entrega Estimada
            </label>
            <DateToggle
              value={filters.entrega_estimada}
              onChange={(v) => set("entrega_estimada", v)}
            />
          </div>

          {/* Monto Total */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Monto Total
            </label>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  $
                </span>
                <input
                  type="number"
                  placeholder="Mínimo"
                  value={filters.monto_min}
                  onChange={(e) => set("monto_min", e.target.value)}
                  className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#e42200]"
                />
              </div>
              <span className="text-gray-400 text-sm">—</span>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  $
                </span>
                <input
                  type="number"
                  placeholder="Máximo"
                  value={filters.monto_max}
                  onChange={(e) => set("monto_max", e.target.value)}
                  className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#e42200]"
                />
              </div>
            </div>
          </div>

          {/* Empresa */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Empresa
            </label>
            <input
              type="text"
              placeholder="Buscar empresa..."
              value={filters.empresa}
              onChange={(e) => set("empresa", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#e42200]"
            />
          </div>

          {/* Cliente */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Cliente
            </label>
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={filters.cliente}
              onChange={(e) => set("cliente", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#e42200]"
            />
          </div>

          {/* Folio */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Folio
            </label>
            <input
              type="text"
              placeholder="Buscar folio..."
              value={filters.folio}
              onChange={(e) => set("folio", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#e42200]"
            />
          </div>

          {/* Estatus */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Estatus
            </label>
            <select
              value={filters.estatus}
              onChange={(e) => set("estatus", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#e42200] bg-white text-gray-700"
            >
              <option value="">Todos los estatus</option>
              {ESTATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={handleReset}
            className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Limpiar filtros
          </button>
          <button
            onClick={handleApply}
            className="flex-1 py-2.5 rounded-lg bg-[#e42200] text-white text-sm font-medium hover:bg-[#c41d00] transition-colors"
          >
            Aplicar
          </button>
        </div>
      </div>
    </>
  );
}
