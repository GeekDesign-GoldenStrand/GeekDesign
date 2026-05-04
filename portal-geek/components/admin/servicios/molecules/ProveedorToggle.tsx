"use client";

import { useEffect, useState } from "react";

import { Toggle } from "@/components/admin/servicios/atoms/Toggle";
import type { ProveedorOption } from "@/types/servicios";

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
  const requiereProveedor = value.id !== null;
  const [editingPrecio, setEditingPrecio] = useState(false);
  const [precioDraft, setPrecioDraft] = useState<string>("");

  const ordenados = [...opciones].sort((a, b) => {
    if (a.costo === null && b.costo === null) return 0;
    if (a.costo === null) return 1;
    if (b.costo === null) return -1;
    return parseFloat(a.costo) - parseFloat(b.costo);
  });

  const primerConCosto = ordenados.find((p) => p.costo !== null) ?? null;

  const proveedorSeleccionado =
    value.id !== null
      ? opciones.find((o) => o.id_proveedor === value.id) ?? null
      : null;

  const costoMaestro =
    proveedorSeleccionado && proveedorSeleccionado.costo !== null
      ? parseFloat(proveedorSeleccionado.costo)
      : null;

  const tieneOverride =
    value.costoOverride !== null &&
    costoMaestro !== null &&
    value.costoOverride !== costoMaestro;

  const precioEfectivo =
    value.costoOverride !== null ? value.costoOverride : costoMaestro;

  useEffect(() => {
    if (requiereProveedor && value.id === null && primerConCosto !== null) {
      onChange({
        id: primerConCosto.id_proveedor,
        costoOverride: null,
      });
    }
  }, [requiereProveedor, value.id, primerConCosto, onChange]);

  useEffect(() => {
    if (!requiereProveedor) {
      setEditingPrecio(false);
      setPrecioDraft("");
    }
  }, [requiereProveedor]);

  useEffect(() => {
    setEditingPrecio(false);
    setPrecioDraft("");
  }, [value.id]);

  const handleToggle = (siRequiere: boolean) => {
    if (siRequiere) {
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

  const handleSelectProveedor = (newId: number) => {
    onChange({ id: newId, costoOverride: null });
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
        <label className="text-sm font-medium text-[#1e1e1e]">Proveedor:</label>
        <Toggle checked={requiereProveedor} onChange={handleToggle} />
      </div>

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
            {ordenados.map((p) => {
              const isSelected = p.id_proveedor === value.id;
              const masterCost = p.costo !== null ? parseFloat(p.costo) : null;
              const precioMostrado =
                isSelected && precioEfectivo !== null
                  ? precioEfectivo
                  : masterCost;

              return (
                <option key={p.id_proveedor} value={p.id_proveedor}>
                  {p.nombre_proveedor}
                  {precioMostrado !== null &&
                    ` — ${formatCosto(precioMostrado)}`}
                  {isSelected && tieneOverride ? " (modificado)" : ""}
                </option>
              );
            })}
          </select>

          {proveedorSeleccionado && costoMaestro !== null && (
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
                    <span className="text-xs text-gray-600">
                      Precio para este servicio:
                    </span>
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