"use client";

import { useEffect } from "react";

import type { InstaladorOption } from "@/types/servicios";

// Value object: id and per-service price override travel together.
export type InstaladorSelection = {
  id: number | null;
  costoOverride: number | null;
};

type InstaladorToggleProps = {
  opciones: InstaladorOption[];
  value: InstaladorSelection;
  onChange: (value: InstaladorSelection) => void;
};

export function InstaladorToggle({
  opciones,
  value,
  onChange,
}: InstaladorToggleProps) {
  // Derived: is the toggle on "Sí"?
  const requiereInstalador = value.id !== null;

  // Sort installers by price asc (cheapest first).
  const ordenados = [...opciones].sort(
    (a, b) =>
      parseFloat(a.costo_instalacion) - parseFloat(b.costo_instalacion)
  );

  // The currently selected installer's master record (for showing original price).
  const instaladorSeleccionado =
    value.id !== null
      ? opciones.find((o) => o.id_instalador === value.id) ?? null
      : null;

  const costoMaestro = instaladorSeleccionado
    ? parseFloat(instaladorSeleccionado.costo_instalacion)
    : null;

  // Whether the admin has set an override that's actually different from the master price.
  const tieneOverride =
    value.costoOverride !== null &&
    costoMaestro !== null &&
    value.costoOverride !== costoMaestro;

  // Auto-preselect cheapest when toggling "Sí" without a prior selection.
  useEffect(() => {
    if (requiereInstalador && value.id === null && ordenados.length > 0) {
      onChange({
        id: ordenados[0].id_instalador,
        costoOverride: null,
      });
    }
  }, [requiereInstalador, value.id, ordenados, onChange]);

  // Toggle handler — clears override when switching off.
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
    }
  };

  // Selecting a different installer resets the override.
  const handleSelectInstalador = (newId: number) => {
    onChange({ id: newId, costoOverride: null });
  };

  // Override input handler.
  const handleOverrideChange = (raw: string) => {
    if (raw === "") {
      // Empty input — let the user clear it; we keep override as-is until they finish.
      // The "Restaurar" button is the explicit way to reset.
      onChange({ ...value, costoOverride: null });
      return;
    }
    const parsed = parseFloat(raw);
    if (!isNaN(parsed) && parsed >= 0) {
      onChange({ ...value, costoOverride: parsed });
    }
  };

  // Restore master price.
  const handleRestore = () => {
    onChange({ ...value, costoOverride: null });
  };

  // Format MXN currency.
  const formatCosto = (costo: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(costo);

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-[#1e1e1e]">Instalador</label>

      {/* Yes/No toggle */}
      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="instalador-toggle"
            checked={requiereInstalador}
            onChange={() => handleToggle(true)}
            className="w-4 h-4 text-[#e42200] focus:ring-[#e42200]"
          />
          <span className="text-sm text-[#1e1e1e]">Sí</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="instalador-toggle"
            checked={!requiereInstalador}
            onChange={() => handleToggle(false)}
            className="w-4 h-4 text-[#e42200] focus:ring-[#e42200]"
          />
          <span className="text-sm text-[#1e1e1e]">No</span>
        </label>
      </div>

      {/* Installer dropdown — only when toggle is "Sí" */}
      {requiereInstalador && (
        <>
          <select
            value={value.id ?? ""}
            onChange={(e) => handleSelectInstalador(Number(e.target.value))}
            className="h-10 px-3 rounded-md border border-gray-300 bg-white text-[#1e1e1e] focus:outline-none focus:ring-2 focus:ring-[#e42200] focus:border-transparent"
          >
            {ordenados.length === 0 && (
              <option value="">No hay instaladores disponibles</option>
            )}
            {ordenados.map((i) => (
              <option key={i.id_instalador} value={i.id_instalador}>
                {i.nombre_proveedor} — {formatCosto(parseFloat(i.costo_instalacion))}
              </option>
            ))}
          </select>

          {/* Price override section — only if there's a selected installer */}
          {instaladorSeleccionado && costoMaestro !== null && (
            <div className="flex flex-col gap-1 pt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">
                  Precio para este servicio:
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={value.costoOverride ?? ""}
                  placeholder={formatCosto(costoMaestro).replace("$", "")}
                  onChange={(e) => handleOverrideChange(e.target.value)}
                  className="h-8 px-2 w-24 rounded-md border border-gray-300 text-sm text-[#1e1e1e] focus:outline-none focus:ring-2 focus:ring-[#e42200] focus:border-transparent"
                />
                {tieneOverride && (
                  <button
                    type="button"
                    onClick={handleRestore}
                    className="text-xs text-[#e42200] hover:underline"
                  >
                    Restaurar precio original
                  </button>
                )}
              </div>

              {tieneOverride && (
                <p className="text-xs text-gray-500">
                  Precio estándar: {formatCosto(costoMaestro)} — Modificado a:{" "}
                  {formatCosto(value.costoOverride!)}
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}