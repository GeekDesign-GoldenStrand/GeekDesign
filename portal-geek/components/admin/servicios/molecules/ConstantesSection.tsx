"use client";

import { InfoIcon, LockKeyIcon, XIcon } from "@phosphor-icons/react";
import { useState } from "react";

import { toSnakeIdentifier } from "@/lib/utils/slug";
import type { TipoVariableOption } from "@/types/servicios";

import { Icon } from "../atoms/Icon";
import { Toggle } from "../atoms/Toggle";

export type ConstanteDraft = {
  nombre_constante: string;
  origen: "global" | "manual";
  valor?: string;
  id_tipo_variable?: number;
  unidad?: string;
};

type ConstantesSectionProps = {
  tiposDisponibles: TipoVariableOption[];
  constantes: ConstanteDraft[];
  onChange: (constantes: ConstanteDraft[]) => void;
};

const MAX_NOMBRE_LEN = 30;

const UNIT_OPTIONS = [
  "$ - pesos",
  "cm - centímetros",
  "cm² - centímetros cuadrados",
  "m - metros",
  "m² - metros cuadrados",
  "pz - piezas",
  "min - minutos",
  "horas - horas",
  "% - porcentaje",
  "unidad - unidades",
] as const;

const getTipoUnidad = (id: number, tipos: TipoVariableOption[]) => {
  const tipo = tipos.find((t) => t.id_tipo_variable === id);
  return tipo?.unidad_default ?? "unidad";
};

export function ConstantesSection({
  tiposDisponibles,
  constantes,
  onChange,
}: ConstantesSectionProps) {
  const [activarConstantes, setActivarConstantes] = useState(constantes.length > 0);

  const [draft, setDraft] = useState({
    etiqueta: "",
    id_tipo_variable: tiposDisponibles[0]?.id_tipo_variable ?? 0,
    unidad: getTipoUnidad(tiposDisponibles[0]?.id_tipo_variable ?? 0, tiposDisponibles),
    valor: "",
  });

  const [error, setError] = useState<string | null>(null);

  const previewNombre = draft.etiqueta
    ? toSnakeIdentifier(draft.etiqueta).slice(0, MAX_NOMBRE_LEN)
    : "";

  const handleAdd = () => {
    setError(null);

    if (!draft.etiqueta.trim()) {
      setError("Escribe el nombre de la constante");
      return;
    }
    const nombre = toSnakeIdentifier(draft.etiqueta).slice(0, MAX_NOMBRE_LEN);
    if (!nombre) {
      setError("El nombre debe contener letras o números");
      return;
    }
    if (nombre === "iva") {
      setError(`"iva" es un nombre reservado. El IVA se gestiona automáticamente.`);
      return;
    }
    if (constantes.some((c) => c.nombre_constante === nombre)) {
      setError(`Ya existe una constante con el identificador "${nombre}". Usa un nombre distinto.`);
      return;
    }
    if (draft.id_tipo_variable === 0) {
      setError("Selecciona un tipo");
      return;
    }
    if (draft.valor.trim() === "") {
      setError("Escribe el valor de la constante");
      return;
    }
    const valorParsed = parseFloat(draft.valor);
    if (isNaN(valorParsed)) {
      setError("El valor de la constante debe ser un número");
      return;
    }

    onChange([
      ...constantes,
      {
        nombre_constante: nombre,
        origen: "manual",
        valor: valorParsed.toFixed(4),
        id_tipo_variable: draft.id_tipo_variable,
        unidad: draft.unidad || undefined,
      },
    ]);

    setDraft({
      etiqueta: "",
      id_tipo_variable: tiposDisponibles[0]?.id_tipo_variable ?? 0,
      unidad: getTipoUnidad(tiposDisponibles[0]?.id_tipo_variable ?? 0, tiposDisponibles),
      valor: "",
    });
  };

  const handleRemove = (nombre: string) => {
    onChange(constantes.filter((c) => c.nombre_constante !== nombre));
  };

  const tipoNombre = (id: number) =>
    tiposDisponibles.find((t) => t.id_tipo_variable === id)?.nombre_tipo ?? "Desconocido";

  const chipDescripcion = (c: ConstanteDraft): string => {
    if (c.origen === "global") {
      return c.nombre_constante === "iva" ? "16% — fijo" : "Constante del sistema";
    }
    const partes = [
      c.id_tipo_variable ? tipoNombre(c.id_tipo_variable) : null,
      c.valor ? `${parseFloat(c.valor)}${c.unidad ? ` ${c.unidad}` : ""}` : null,
    ].filter(Boolean);
    return partes.join(" · ");
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Toggle header — mismo patrón que InstaladorToggle / ProveedorToggle */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-[#1e1e1e]">Constantes:</h3>
        <Toggle checked={activarConstantes} onChange={setActivarConstantes} />
      </div>

      {activarConstantes && (
        <>
          <div>
            <p className="text-sm text-gray-600">
              Valores fijos del servicio (no cambian por cotización). El IVA siempre está incluido.
            </p>
            <p className="text-sm text-gray-500 italic mt-1">Ejemplos: markup, comisión, etc.</p>
          </div>

          {/* Chips list */}
          {constantes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {constantes.map((c) => (
                <div
                  key={c.nombre_constante}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                    c.origen === "global"
                      ? "bg-blue-100 text-blue-900 border border-blue-300"
                      : "bg-[#fce4e4] text-[#e42200] border border-[#fce4e4]"
                  }`}
                  title={chipDescripcion(c)}
                >
                  {c.origen === "global" && (
                    <Icon LibIcon={LockKeyIcon} size={12} weight="bold" />
                  )}
                  <span className="font-mono">{c.nombre_constante}</span>
                  <span className="text-sm opacity-70">{chipDescripcion(c)}</span>
                  {c.origen === "manual" && (
                    <button
                      type="button"
                      onClick={() => handleRemove(c.nombre_constante)}
                      className="hover:bg-[#e42200]/20 rounded-full p-0.5 transition-colors"
                      aria-label={`Quitar ${c.nombre_constante}`}
                    >
                      <Icon LibIcon={XIcon} size={12} weight="bold" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Inline form to add a manual constante */}
          <div className="flex flex-col gap-3 p-3 bg-gray-50 rounded-md border border-dashed border-gray-300">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Nombre de la constante{" "}
                <span className="text-gray-400 font-normal">(máx. {MAX_NOMBRE_LEN} caracteres)</span>
              </label>
              <input
                type="text"
                placeholder="Ej. Markup de mostrador"
                value={draft.etiqueta}
                onChange={(e) => setDraft((d) => ({ ...d, etiqueta: e.target.value }))}
                className="h-9 px-2 rounded-md border border-gray-300 bg-white text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#e42200]"
                maxLength={MAX_NOMBRE_LEN}
              />
              {previewNombre && (
                <div className="mt-1 flex items-center gap-1 text-sm text-blue-700">
                  <Icon LibIcon={InfoIcon} size={12} weight="bold" />
                  <span>
                    En la fórmula lo escribes:{" "}
                    <code className="bg-blue-50 px-1 rounded font-mono">{previewNombre}</code>
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Valor de la constante
              </label>
              <input
                type="number"
                step="0.0001"
                placeholder="Ej. 1.4"
                value={draft.valor}
                onChange={(e) => setDraft((d) => ({ ...d, valor: e.target.value }))}
                className="h-9 px-2 rounded-md border border-gray-300 bg-white text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#e42200]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Tipo</label>
                <select
                  value={draft.id_tipo_variable}
                  onChange={(e) => {
                    const selectedTypeId = Number(e.target.value);
                    setDraft((d) => ({
                      ...d,
                      id_tipo_variable: selectedTypeId,
                      unidad: getTipoUnidad(selectedTypeId, tiposDisponibles),
                    }));
                  }}
                  className="h-9 px-2 rounded-md border border-gray-300 bg-white text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#e42200]"
                >
                  <option value={0}>Selecciona...</option>
                  {tiposDisponibles.map((t) => (
                    <option key={t.id_tipo_variable} value={t.id_tipo_variable}>
                      {t.nombre_tipo}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Unidad</label>
                <select
                  value={draft.unidad ?? "unidad"}
                  onChange={(e) => setDraft((d) => ({ ...d, unidad: e.target.value }))}
                  className="h-9 px-2 rounded-md border border-gray-300 bg-white text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#e42200]"
                >
                  {UNIT_OPTIONS.map((unidad) => (
                    <option key={unidad} value={unidad}>
                      {unidad}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {error && <p className="text-sm text-[#e42200]">{error}</p>}

            <button
              type="button"
              onClick={handleAdd}
              className="h-10 px-5 bg-[#e42200] text-white hover:bg-[#c41e00] rounded-full text-sm font-medium transition-colors"
            >
              + Agregar constante
            </button>
          </div>
        </>
      )}
    </div>
  );
}
