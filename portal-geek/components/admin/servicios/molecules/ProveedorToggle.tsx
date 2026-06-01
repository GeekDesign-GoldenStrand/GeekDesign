"use client";

import { useEffect, useState } from "react";

import { Toggle } from "@/components/admin/servicios/atoms/Toggle";
import { Button } from "@/components/ui/atoms/Button";
import { Select, SelectOption } from "@/components/ui/atoms/Select";
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

export function ProveedorToggle({ opciones, value, onChange }: ProveedorToggleProps) {
  // Separate user intent (wants a provider) from actual selection (id !== null).
  // This allows the toggle to respond and show feedback even when opciones is empty.
  const [wantsProvider, setWantsProvider] = useState(value.id !== null);
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
    value.id !== null ? (opciones.find((o) => o.id_proveedor === value.id) ?? null) : null;

  const costoMaestro =
    proveedorSeleccionado && proveedorSeleccionado.costo !== null
      ? parseFloat(proveedorSeleccionado.costo)
      : null;

  const tieneOverride =
    value.costoOverride !== null && costoMaestro !== null && value.costoOverride !== costoMaestro;

  const precioEfectivo = value.costoOverride !== null ? value.costoOverride : costoMaestro;

  useEffect(() => {
    if (wantsProvider && value.id === null && primerConCosto !== null) {
      onChange({
        id: primerConCosto.id_proveedor,
        costoOverride: null,
      });
    }
  }, [wantsProvider, value.id, primerConCosto, onChange]);

  const handleToggle = (siRequiere: boolean) => {
    setWantsProvider(siRequiere);
    if (siRequiere) {
      const target = primerConCosto ?? ordenados[0];
      if (target) {
        onChange({ id: target.id_proveedor, costoOverride: null });
      } else {
        onChange({ id: null, costoOverride: null });
      }
    } else {
      onChange({ id: null, costoOverride: null });
      setEditingPrecio(false);
      setPrecioDraft("");
    }
  };

  const handleSelectProveedor = (newId: number) => {
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
        <label className="text-base font-bold text-[#1e1e1e]">Proveedor:</label>
        <Toggle checked={wantsProvider} onChange={handleToggle} />
      </div>

      {wantsProvider && opciones.length === 0 && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          No hay proveedores registrados. Agrega uno desde el módulo de Terceros para poder
          vincularlo a este servicio.
        </p>
      )}

      {wantsProvider && opciones.length > 0 && (
        <>
          <Select
            value={value.id === null ? "" : String(value.id)}
            onChange={(v) => handleSelectProveedor(Number(v))}
            size="md"
          >
            {ordenados.map((p) => {
              const isSelected = p.id_proveedor === value.id;
              const masterCost = p.costo !== null ? parseFloat(p.costo) : null;
              const precioMostrado =
                isSelected && precioEfectivo !== null ? precioEfectivo : masterCost;

              return (
                <SelectOption key={p.id_proveedor} value={String(p.id_proveedor)}>
                  {p.nombre_proveedor}
                  {precioMostrado !== null && ` — ${formatCosto(precioMostrado)}`}
                  {isSelected && tieneOverride ? " (modificado)" : ""}
                </SelectOption>
              );
            })}
          </Select>

          {proveedorSeleccionado && costoMaestro !== null && (
            <div className="flex flex-col gap-2 pt-2">
              {!editingPrecio && (
                <>
                  {tieneOverride ? (
                    <div className="flex flex-col gap-2">
                      <p className="text-sm text-gray-700">
                        Precio personalizado:{" "}
                        <span className="font-semibold text-[#1e1e1e]">
                          {formatCosto(value.costoOverride!)}
                        </span>
                      </p>
                      <p className="text-sm text-gray-500">
                        Precio estándar: {formatCosto(costoMaestro)}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={handleStartEdit}
                        >
                          Editar precio
                        </Button>
                        <Button type="button" variant="secondary" size="sm" onClick={handleRestore}>
                          Restaurar precio original
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button type="button" variant="secondary" size="sm" onClick={handleStartEdit}>
                      Editar precio para este servicio
                    </Button>
                  )}
                </>
              )}

              {editingPrecio && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Precio para este servicio:</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={precioDraft}
                      onChange={(e) => {
                        // Currency input: digits + optional decimal point + up to 2
                        // decimal places. Numerical cap at $9,999,999.99 instead of a
                        // char count, so the effective max is the same regardless of
                        // decimal usage.
                        const next = e.target.value;
                        if (next === "") {
                          setPrecioDraft("");
                          return;
                        }
                        if (!/^\d*(\.\d{0,2})?$/.test(next)) return;
                        const parsed = parseFloat(next);
                        if (!isNaN(parsed) && parsed > 9999999.99) return;
                        setPrecioDraft(next);
                      }}
                      autoFocus
                      className="h-8 px-2 w-28 rounded-md border border-gray-300 text-sm text-[#1e1e1e] focus:outline-none focus:ring-2 focus:ring-[#e42200] focus:border-transparent"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="primary" size="sm" onClick={handleApplyPrecio}>
                      Aplicar precio
                    </Button>
                    <Button type="button" variant="secondary" size="sm" onClick={handleCancelEdit}>
                      Cancelar
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500">
                    Precio estándar: {formatCosto(costoMaestro)}
                  </p>
                </div>
              )}
            </div>
          )}

          {proveedorSeleccionado && costoMaestro === null && (
            <p className="text-sm text-gray-500 pt-2">
              Este proveedor no tiene precio fijo. Se cotizará por proyecto.
            </p>
          )}
        </>
      )}
    </div>
  );
}
