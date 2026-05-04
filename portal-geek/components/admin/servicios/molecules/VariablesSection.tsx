"use client";

import { InfoIcon, XIcon } from "@phosphor-icons/react";
import { useState } from "react";

import { toSnakeIdentifier } from "@/lib/utils/slug";
import type { TipoVariableOption } from "@/types/servicios";

import { Icon } from "../atoms/Icon";

export type VariableDraft = {
  id_tipo_variable: number;
  nombre_variable: string;
  etiqueta: string;
  valor_default?: string;
  editable_por_cliente: boolean;
  unidad?: string;
};

type VariablesSectionProps = {
  tiposDisponibles: TipoVariableOption[];
  variables: VariableDraft[];
  onChange: (variables: VariableDraft[]) => void;
};

const MAX_NOMBRE_LEN = 30;

export function VariablesSection({ tiposDisponibles, variables, onChange }: VariablesSectionProps) {
  const [draft, setDraft] = useState({
    etiqueta: "",
    id_tipo_variable: tiposDisponibles[0]?.id_tipo_variable ?? 0,
    unidad: "",
    valor_default: "",
    editable_por_cliente: true,
  });

  const [error, setError] = useState<string | null>(null);

  const previewNombre = draft.etiqueta
    ? toSnakeIdentifier(draft.etiqueta).slice(0, MAX_NOMBRE_LEN)
    : "";

  const handleAdd = () => {
    setError(null);

    if (!draft.etiqueta.trim()) {
      setError("Escribe el nombre de la variable");
      return;
    }
    const nombre = toSnakeIdentifier(draft.etiqueta).slice(0, MAX_NOMBRE_LEN);
    if (!nombre) {
      setError("El nombre debe contener letras o números");
      return;
    }
    if (variables.some((v) => v.nombre_variable === nombre)) {
      setError(`Ya existe una variable con el identificador "${nombre}". Usa un nombre distinto.`);
      return;
    }
    if (draft.id_tipo_variable === 0) {
      setError("Selecciona un tipo");
      return;
    }
    if (draft.valor_default.trim() === "") {
      setError("Escribe el valor de la variable");
      return;
    }
    const valorParsed = parseFloat(draft.valor_default);
    if (isNaN(valorParsed)) {
      setError("El valor de la variable debe ser un número");
      return;
    }

    onChange([
      ...variables,
      {
        nombre_variable: nombre,
        etiqueta: draft.etiqueta.trim(),
        id_tipo_variable: draft.id_tipo_variable,
        unidad: draft.unidad || undefined,
        valor_default: valorParsed.toString(),
        editable_por_cliente: draft.editable_por_cliente,
      },
    ]);

    setDraft({
      etiqueta: "",
      id_tipo_variable: tiposDisponibles[0]?.id_tipo_variable ?? 0,
      unidad: "",
      valor_default: "",
      editable_por_cliente: true,
    });
  };

  const handleRemove = (nombre: string) => {
    onChange(variables.filter((v) => v.nombre_variable !== nombre));
  };

  const tipoNombre = (id: number) =>
    tiposDisponibles.find((t) => t.id_tipo_variable === id)?.nombre_tipo ?? "Desconocido";

  // Build the chip's secondary text: tipo, valor, unidad, edit flag.
  const chipDescripcion = (v: VariableDraft) => {
    const partes = [
      tipoNombre(v.id_tipo_variable),
      `${v.valor_default}${v.unidad ? ` ${v.unidad}` : ""}`,
      v.editable_por_cliente ? "editable" : "fija",
    ];
    return partes.join(" · ");
  };

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h3 className="text-sm font-semibold text-[#1e1e1e]">Variables:</h3>
        <p className="text-xs text-gray-600 mt-1">
          Datos numéricos que cambian en cada cotización. El cliente o tú los capturan al momento de
          cotizar.
        </p>
        <p className="text-xs text-gray-500 italic mt-1">
          Ejemplos: ancho, altura, cantidad de piezas, perímetro, etc.
        </p>
      </div>

      {/* Chips list (matches Constantes styling) */}
      {variables.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {variables.map((v) => (
            <div
              key={v.nombre_variable}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-[#fce4e4] text-[#e42200] border border-[#fce4e4]"
              title={`${v.etiqueta} · ${chipDescripcion(v)}`}
            >
              <span className="font-mono">{v.nombre_variable}</span>
              <span className="text-xs opacity-70">{chipDescripcion(v)}</span>
              <button
                type="button"
                onClick={() => handleRemove(v.nombre_variable)}
                className="hover:bg-[#e42200]/20 rounded-full p-0.5 transition-colors"
                aria-label={`Quitar ${v.etiqueta}`}
              >
                <Icon LibIcon={XIcon} size={12} weight="bold" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3 p-3 bg-gray-50 rounded-md border border-dashed border-gray-300">
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 block">
            Nombre de la variable{" "}
            <span className="text-gray-400 font-normal">(máx. {MAX_NOMBRE_LEN} caracteres)</span>
          </label>
          <input
            type="text"
            placeholder="Ej. Ancho de la pieza"
            value={draft.etiqueta}
            onChange={(e) => setDraft((d) => ({ ...d, etiqueta: e.target.value }))}
            className="h-9 px-2 rounded-md border border-gray-300 bg-white text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#e42200]"
            maxLength={MAX_NOMBRE_LEN}
          />
          {previewNombre && (
            <div className="mt-1 flex items-center gap-1 text-xs text-blue-700">
              <Icon LibIcon={InfoIcon} size={12} weight="bold" />
              <span>
                En la fórmula lo escribes:{" "}
                <code className="bg-blue-50 px-1 rounded font-mono">{previewNombre}</code>
              </span>
            </div>
          )}
        </div>

        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 block">
            Valor de la variable
          </label>
          <input
            type="number"
            step="any"
            placeholder="Ej. 50"
            value={draft.valor_default}
            onChange={(e) => setDraft((d) => ({ ...d, valor_default: e.target.value }))}
            className="h-9 px-2 rounded-md border border-gray-300 bg-white text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#e42200]"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Tipo</label>
            <select
              value={draft.id_tipo_variable}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  id_tipo_variable: Number(e.target.value),
                }))
              }
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
            <label className="text-xs font-medium text-gray-700 mb-1 block">Unidad</label>
            <input
              type="text"
              placeholder="cm, pz, $"
              value={draft.unidad}
              onChange={(e) => setDraft((d) => ({ ...d, unidad: e.target.value }))}
              className="h-9 px-2 rounded-md border border-gray-300 bg-white text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#e42200]"
              maxLength={20}
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={draft.editable_por_cliente}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                editable_por_cliente: e.target.checked,
              }))
            }
            className="w-4 h-4 text-[#e42200] focus:ring-[#e42200]"
          />
          El cliente puede editar este valor al cotizar
        </label>

        {error && <p className="text-xs text-[#e42200]">{error}</p>}

        <button
          type="button"
          onClick={handleAdd}
          className="self-start bg-[#e42200] text-white hover:bg-[#c41e00] px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          + Agregar variable
        </button>
      </div>
    </div>
  );
}
