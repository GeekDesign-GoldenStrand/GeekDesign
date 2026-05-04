"use client";

import { useEffect, useState } from "react";

import { Toggle } from "@/components/admin/servicios/atoms/Toggle";
import type { InstaladorOption } from "@/types/servicios";

export type InstaladorSelection = {
  id: number | null;
  costoOverride: number | null;
};

type InstaladorToggleProps = {
  opciones: InstaladorOption[];
  value: InstaladorSelection;
  onChange: (value: InstaladorSelection) => void;
};

export function InstaladorToggle({ opciones, value, onChange }: InstaladorToggleProps) {
  const requiereInstalador = value.id !== null;
  const [editingPrecio, setEditingPrecio] = useState(false);
  const [precioDraft, setPrecioDraft] = useState<string>("");

  const ordenados = [...opciones].sort(
    (a, b) => parseFloat(a.costo_instalacion) - parseFloat(b.costo_instalacion)
  );

  const instaladorSeleccionado =
    value.id !== null ? (opciones.find((o) => o.id_instalador === value.id) ?? null) : null;

  const costoMaestro = instaladorSeleccionado
    ? parseFloat(instaladorSeleccionado.costo_instalacion)
    : null;

  const tieneOverride =
    value.costoOverride !== null && costoMaestro !== null && value.costoOverride !== costoMaestro;

  // Effective price: override if set, otherwise master.
  const precioEfectivo = value.costoOverride !== null ? value.costoOverride : costoMaestro;

  useEffect(() => {
    if (requiereInstalador && value.id === null && ordenados.length > 0) {
      onChange({
        id: ordenados[0].id_instalador,
        costoOverride: null,
      });
    }
  }, [requiereInstalador, value.id, ordenados, onChange]);

  const handleToggle = (siRequiere: boolean) => {
    if (siRequiere) {
      if (ordenados.length > 0) {
        onChange({
          id: ordenados[0].id_instalador,
          costoOverride: null,
        });
      }
    } else {
      onChange({ id: null, costoOverride: null });
      setEditingPrecio(false);
      setPrecioDraft("");
    }
  };

  const handleSelectInstalador = (newId: number) => {
    onChange({ id: newId, costoOverride: null });
    setEditingPrecio(false);
    setPrecioDraft("");
  };

  const handleStartEdit = () => {
    setPrecioDraft(
      value.costoOverride !== null
        ? value.costoOverride.toString()
        : costoMaestro !== null
          ? costoMaestro.toString()
          : ""
    );
    setEditingPrecio(true);
  };

  const handleApplyPrecio = () => {
    const parsed = parseFloat(precioDraft);
    if (isNaN(parsed) || parsed < 0) {
      setEditingPrecio(false);
      return;
    }
    onChange({
      ...value,
      costoOverride: parsed === costoMaestro ? null : parsed,
    });
    setEditingPrecio(false);
  };

  const handleCancelEdit = () => {
    setEditingPrecio(false);
    setPrecioDraft("");
  };

  const handleRestore = () => {
    onChange({ ...value, costoOverride: null });
    setEditingPrecio(false);
    setPrecioDraft("");
  };

  // Format MXN currency with 2 decimals (no rounding).
  const formatCosto = (costo: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(costo);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-[#1e1e1e]">Instalador:</label>
        <Toggle checked={requiereInstalador} onChange={handleToggle} />
      </div>

      {requiereInstalador && (
        <>
          <select
            value={value.id ?? ""}
            onChange={(e) => handleSelectInstalador(Number(e.target.value))}
            className="h-10 px-3 rounded-md border border-gray-300 bg-white text-[#1e1e1e] focus:outline-none focus:ring-2 focus:ring-[#e42200] focus:border-transparent"
          >
            {ordenados.length === 0 && <option value="">No hay instaladores disponibles</option>}
            {ordenados.map((i) => {
              // For the currently-selected installer, show the effective price
              // (override if any), so the dropdown reflects the active value.
              const isSelected = i.id_instalador === value.id;
              const precioMostrado =
                isSelected && precioEfectivo !== null
                  ? precioEfectivo
                  : parseFloat(i.costo_instalacion);

              return (
                <option key={i.id_instalador} value={i.id_instalador}>
                  {i.nombre_proveedor} — {formatCosto(precioMostrado)}
                  {isSelected && tieneOverride ? " (modificado)" : ""}
                </option>
              );
            })}
          </select>

          {instaladorSeleccionado && costoMaestro !== null && (
            <div className="flex flex-col gap-2 pt-2">
              {!editingPrecio && (
                <>
                  {tieneOverride ? (
                    <div className="flex flex-col gap-2">
                      <p className="text-xs text-gray-700">
                        Precio personalizado:{" "}
                        <span className="font-semibold text-[#1e1e1e]">
                          {formatCosto(value.costoOverride!)}
                        </span>
                      </p>
                      <p className="text-xs text-gray-500">
                        Precio estándar: {formatCosto(costoMaestro)}
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleStartEdit}
                          className="text-xs bg-white border border-gray-300 hover:bg-gray-50 px-3 py-1.5 rounded-md font-medium text-[#1e1e1e]"
                        >
                          Editar precio
                        </button>
                        <button
                          type="button"
                          onClick={handleRestore}
                          className="text-xs bg-white border border-[#e42200] text-[#e42200] hover:bg-red-50 px-3 py-1.5 rounded-md font-medium"
                        >
                          Restaurar precio original
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleStartEdit}
                      className="self-start text-xs bg-white border border-gray-300 hover:bg-gray-50 px-3 py-1.5 rounded-md font-medium text-[#1e1e1e]"
                    >
                      Editar precio para este servicio
                    </button>
                  )}
                </>
              )}

              {editingPrecio && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">Precio para este servicio:</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={precioDraft}
                      onChange={(e) => setPrecioDraft(e.target.value)}
                      autoFocus
                      className="h-8 px-2 w-28 rounded-md border border-gray-300 text-sm text-[#1e1e1e] focus:outline-none focus:ring-2 focus:ring-[#e42200] focus:border-transparent"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleApplyPrecio}
                      className="text-xs bg-[#e42200] text-white hover:bg-[#c41e00] px-3 py-1.5 rounded-md font-medium"
                    >
                      Aplicar precio
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="text-xs bg-white border border-gray-300 hover:bg-gray-50 px-3 py-1.5 rounded-md font-medium text-[#1e1e1e]"
                    >
                      Cancelar
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Precio estándar: {formatCosto(costoMaestro)}
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
