"use client";

import { useEffect } from "react";
import type { InstaladorOption } from "@/types/servicios";

type InstaladorToggleProps = {
  opciones: InstaladorOption[];
  selectedId: number | null;
  onChange: (id: number | null) => void;
};

export function InstaladorToggle({
  opciones,
  selectedId,
  onChange,
}: InstaladorToggleProps) {

  const requiereInstalador = selectedId !== null;

  //Organized installers by installation cost, cheapest first. This way we can preselect the cheapest 
  // when the admin toggles "Sí" for the first time.
  const ordenados = [...opciones].sort(
    (a, b) => parseFloat(a.costo_instalacion) - parseFloat(b.costo_instalacion)
  );

  // If the toogle is in "Si" position but there's no selected installer 
  // (ej: first time toggling), we select the cheapest one by default.
  useEffect(() => {
    if (requiereInstalador && selectedId === null && ordenados.length > 0) {
      onChange(ordenados[0].id_instalador);
    }
  }, [requiereInstalador, selectedId, ordenados, onChange]);


  const handleToggle = (siRequiere: boolean) => {
    if (siRequiere) {
      if (ordenados.length > 0) {
        onChange(ordenados[0].id_instalador);
      }
    } else {
      onChange(null);
    }
  };

  // MXN currency formatter.
  const formatCosto = (costo: string) => {
  const num = parseFloat(costo);
  return new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(num);
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-[#1e1e1e]">Instalador</label>

      {/* Toggle Sí/No */}
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

      {/* Dropdown of installers */}
      {requiereInstalador && (
        <select
          value={selectedId ?? ""}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-10 px-3 rounded-md border border-gray-300 bg-white text-[#1e1e1e] focus:outline-none focus:ring-2 focus:ring-[#e42200] focus:border-transparent"
        >
          {ordenados.map((instalador) => {
            const nombre = instalador.apodo ?? instalador.nombre_proveedor;
            const costoFormateado = formatCosto(instalador.costo_instalacion);
            return (
              <option
                key={instalador.id_instalador}
                value={instalador.id_instalador}
              >
                {nombre} — {costoFormateado}
              </option>
            );
          })}
        </select>
      )}

      {/* if there´s not an installer available */}
      {requiereInstalador && ordenados.length === 0 && (
        <p className="text-xs text-gray-500">
          No hay instaladores disponibles.
        </p>
      )}
    </div>
  );
}
