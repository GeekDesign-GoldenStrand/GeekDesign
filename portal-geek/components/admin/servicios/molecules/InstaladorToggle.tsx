"use client";

import { useEffect, useState } from "react";

import { Toggle } from "@/components/admin/servicios/atoms/Toggle";
import { Button } from "@/components/ui/atoms/Button";
import { Select, SelectOption } from "@/components/ui/atoms/Select";
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
        <label className="text-base font-bold text-[#1e1e1e]">Instalador:</label>
        <Toggle checked={requiereInstalador} onChange={handleToggle} />
      </div>

      {requiereInstalador && (
        <>
          <Select
            value={value.id === null ? "" : String(value.id)}
            onChange={(v) => handleSelectInstalador(Number(v))}
            placeholder={ordenados.length === 0 ? "No hay instaladores disponibles" : undefined}
            size="md"
          >
            {ordenados.map((i) => {
              // For the currently-selected installer, show the effective price
              // (override if any), so the dropdown reflects the active value.
              const isSelected = i.id_instalador === value.id;
              const precioMostrado =
                isSelected && precioEfectivo !== null
                  ? precioEfectivo
                  : parseFloat(i.costo_instalacion);

              return (
                <SelectOption key={i.id_instalador} value={String(i.id_instalador)}>
                  {i.nombre_instalador} — {formatCosto(precioMostrado)}
                  {isSelected && tieneOverride ? " (modificado)" : ""}
                </SelectOption>
              );
            })}
          </Select>

          {instaladorSeleccionado && costoMaestro !== null && (
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
                      maxLength={6}
                      value={precioDraft}
                      onChange={(e) => {
                        // Only digits + optional single decimal point, capped at 6 chars
                        // (matches the maxLength). Same strict pattern used on Variables/
                        // Constantes valor inputs.
                        const next = e.target.value;
                        if (next === "" || (/^\d*\.?\d*$/.test(next) && next.length <= 6)) {
                          setPrecioDraft(next);
                        }
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
        </>
      )}
    </div>
  );
}
