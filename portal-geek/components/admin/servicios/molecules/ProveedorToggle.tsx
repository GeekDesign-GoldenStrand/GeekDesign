"use client";

import { useEffect } from "react";

import type { ProveedorOption } from "@/types/servicios";

// Value object: id and per-service price override travel together.
export type ProveedorSelection = {
  id: number | null;
  costoOverride: number | null;
};

type ProveedorToggleProps = {
  opciones: ProveedorOption[];
  value: ProveedorSelection;
  onChange: (value: ProveedorSelection) => void;
};

export function ProveedorToggle({
  opciones,
  value,
  onChange,
}: ProveedorToggleProps) {
  // Derived: is the toggle on "Sí"?
  const requiereProveedor = value.id !== null;

  // Sort providers: those with cost asc first, then those without cost at the end.
  const ordenados = [...opciones].sort((a, b) => {
    if (a.costo === null && b.costo === null) return 0;
    if (a.costo === null) return 1; // Send nulls to the end.
    if (b.costo === null) return -1;
    return parseFloat(a.costo) - parseFloat(b.costo);
  });

  // First provider that has a cost — used for auto-preselect.
  const primerConCosto = ordenados.find((p) => p.costo !== null) ?? null;

  // The currently selected provider's master record.
  const proveedorSeleccionado =
    value.id !== null
      ? opciones.find((o) => o.id_proveedor === value.id) ?? null
      : null;

  const costoMaestro =
    proveedorSeleccionado && proveedorSeleccionado.costo !== null
      ? parseFloat(proveedorSeleccionado.costo)
      : null;

  // Whether the admin has set an override that's actually different from the master price.
  const tieneOverride =
    value.costoOverride !== null &&
    costoMaestro !== null &&
    value.costoOverride !== costoMaestro;

  // Auto-preselect cheapest with cost when toggling "Sí" without a prior selection.
  useEffect(() => {
    if (requiereProveedor && value.id === null && primerConCosto !== null) {
      onChange({
        id: primerConCosto.id_proveedor,
        costoOverride: null,
      });
    }
  }, [requiereProveedor, value.id, primerConCosto, onChange]);

  // Toggle handler — clears override when switching off.
  const handleToggle = (siRequiere: boolean) => {
    if (siRequiere) {
      // Pick cheapest with cost; if none, pick the first available.
      const target = primerConCosto ?? ordenados[0];
      if (target) {
        onChange({
          id: target.id_proveedor,
          costoOverride: null,
        });
      }
    } else {
      onChange({ id: null, costoOverride: null });
    }
  };

  // Selecting a different provider resets the override.
  const handleSelectProveedor = (newId: number) => {
    onChange({ id: newId, costoOverride: null });
  };

  // Override input handler.
  const handleOverrideChange = (raw: string) => {
    if (raw === "") {
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
      <label className="text-sm font-medium text-[#1e1e1e]">Proveedor</label>

      {/* Yes/No toggle */}
      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="proveedor-toggle"
            checked={requiereProveedor}
            onChange={() => handleToggle(true)}
            className="w-4 h-4 text-[#e42200] focus:ring-[#e42200]"
          />
          <span className="text-sm text-[#1e1e1e]">Sí</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="proveedor-toggle"
            checked={!requiereProveedor}
            onChange={() => handleToggle(false)}
            className="w-4 h-4 text-[#e42200] focus:ring-[#e42200]"
          />
          <span className="text-sm text-[#1e1e1e]">No</span>
        </label>
      </div>

      {/* Provider dropdown — only when toggle is "Sí" */}
      {requiereProveedor && (
        <>
          <select
            value={value.id ?? ""}
            onChange={(e) => handleSelectProveedor(Number(e.target.value))}
            className="h-10 px-3 rounded-md border border-gray-300 bg-white text-[#1e1e1e] focus:outline-none focus:ring-2 focus:ring-[#e42200] focus:border-transparent"
          >
            {ordenados.length === 0 && (
              <option value="">No hay proveedores disponibles</option>
            )}
            {ordenados.map((p) => (
              <option key={p.id_proveedor} value={p.id_proveedor}>
                {p.nombre_proveedor}
                {p.costo !== null && ` — ${formatCosto(parseFloat(p.costo))}`}
              </option>
            ))}
          </select>

          {/* Price override section — only if the selected provider has a master cost */}
          {proveedorSeleccionado && costoMaestro !== null && (
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

          {/* Edge case: provider has no master cost. Override doesn't apply. */}
          {proveedorSeleccionado && costoMaestro === null && (
            <p className="text-xs text-gray-500 pt-2">
              Este proveedor no tiene precio fijo. Se cotizará por proyecto.
            </p>
          )}
        </>
      )}
    </div>
  );
}