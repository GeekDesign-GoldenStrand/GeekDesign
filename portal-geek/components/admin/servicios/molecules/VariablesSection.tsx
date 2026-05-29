"use client";

import { InfoIcon, XIcon } from "@phosphor-icons/react";
import { useState } from "react";

import { repeatedWords, sanitizeUserText } from "@/lib/utils/safe-text";
import { Button } from "@/components/ui/atoms/Button";
import { Select, SelectOption } from "@/components/ui/atoms/Select";
import { toSnakeIdentifier } from "@/lib/utils/slug";
import { unidadesParaTipo } from "@/lib/utils/unidades-por-tipo";
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
const MAX_VALOR_DIGITOS = 8;

// Stored value = short symbol (fits FormulaVariables.unidad VarChar(20)).
// Label = verbose description shown in the dropdown only.
const UNIT_OPTIONS = [
  { value: "$", label: "$" },
  { value: "cm", label: "cm" },
  { value: "cm²", label: "cm²" },
  { value: "m", label: "m" },
  { value: "m²", label: "m²" },
  { value: "pz", label: "pz" },
  { value: "min", label: "min" },
  { value: "h", label: "hrs " },
  { value: "%", label: "% " },
  { value: "u", label: "unid" },
] as const;

const getTipoUnidad = (id: number, tipos: TipoVariableOption[]) => {
  const tipo = tipos.find((t) => t.id_tipo_variable === id);
  return tipo?.unidad_default ?? "u";
};

export function VariablesSection({ tiposDisponibles, variables, onChange }: VariablesSectionProps) {
  const [draft, setDraft] = useState({
    etiqueta: "",
    id_tipo_variable: tiposDisponibles[0]?.id_tipo_variable ?? 0,
    unidad: getTipoUnidad(tiposDisponibles[0]?.id_tipo_variable ?? 0, tiposDisponibles),
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
    if (repeatedWords(draft.etiqueta)) {
      setError("El nombre repite la misma palabra varias veces.");
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
      unidad: getTipoUnidad(tiposDisponibles[0]?.id_tipo_variable ?? 0, tiposDisponibles),
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
        <h3 className="text-lg font-bold text-[#1e1e1e]">Variables:</h3>
        <p className="text-sm text-gray-600 mt-1">
          Datos numéricos que cambian en cada cotización. El cliente o tú los capturan al momento de
          cotizar.
        </p>
        <p className="text-sm text-gray-500 italic mt-1">
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
              <span className="text-sm opacity-70">{chipDescripcion(v)}</span>
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
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            Nombre de la variable{" "}
            <span className="text-gray-400 font-normal">(máx. {MAX_NOMBRE_LEN} caracteres)</span>
          </label>
          <input
            type="text"
            placeholder="Ej. Ancho de la pieza"
            value={draft.etiqueta}
            onChange={(e) =>
              setDraft((d) => ({ ...d, etiqueta: sanitizeUserText(e.target.value) }))
            }
            className="h-9 px-2 rounded-md border border-gray-300 bg-white text-sm text-[#1e1e1e] w-full focus:outline-none focus:ring-2 focus:ring-[#e42200]"
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
            Valor de la variable{" "}
            <span className="text-gray-400 font-normal">(máx. {MAX_VALOR_DIGITOS} dígitos)</span>
          </label>
          <input
            type="text"
            inputMode="decimal"
            placeholder="Ej. 50"
            value={draft.valor_default}
            onChange={(e) => {
              // Only allow digits with at most one decimal point, capped at
              // MAX_VALOR_DIGITOS digits (the dot doesn't count). Reject letters,
              // scientific notation, signs, and anything else type="number" would
              // let slip through via paste or "e" key.
              const next = e.target.value;
              const digitCount = next.replace(/\./g, "").length;
              if (next === "" || (/^\d*\.?\d*$/.test(next) && digitCount <= MAX_VALOR_DIGITOS)) {
                setDraft((d) => ({ ...d, valor_default: next }));
              }
            }}
            className="h-9 px-2 rounded-md border border-gray-300 bg-white text-sm text-[#1e1e1e] w-full focus:outline-none focus:ring-2 focus:ring-[#e42200]"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Tipo</label>
            <Select
              value={String(draft.id_tipo_variable)}
              onChange={(v) => {
                const selectedTypeId = Number(v);
                setDraft((d) => ({
                  ...d,
                  id_tipo_variable: selectedTypeId,
                  unidad: getTipoUnidad(selectedTypeId, tiposDisponibles),
                }));
              }}
              placeholder="Selecciona..."
              size="sm"
            >
              {tiposDisponibles.map((t) => (
                <SelectOption key={t.id_tipo_variable} value={String(t.id_tipo_variable)}>
                  {t.nombre_tipo}
                </SelectOption>
              ))}
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Unidad</label>
            <Select
              value={draft.unidad ?? "u"}
              onChange={(v) => setDraft((d) => ({ ...d, unidad: v }))}
              size="sm"
            >
              {(() => {
                // Filter UNIT_OPTIONS by the selected tipo so only related
                // units appear (e.g. cm/m for Dimensión, $ for Costo). If the
                // tipo is unknown or not yet selected, fall back to all units.
                const tipoNombreSeleccionado = tiposDisponibles.find(
                  (t) => t.id_tipo_variable === draft.id_tipo_variable
                )?.nombre_tipo;
                const allowed = unidadesParaTipo(tipoNombreSeleccionado);
                const visibles = allowed
                  ? UNIT_OPTIONS.filter((u) => allowed.includes(u.value))
                  : UNIT_OPTIONS;
                return visibles.map((u) => (
                  <SelectOption key={u.value} value={u.value}>
                    {u.label}
                  </SelectOption>
                ));
              })()}
            </Select>
          </div>
        </div>


        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
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

        {error && <p className="text-sm text-[#e42200]">{error}</p>}

        <Button type="button" variant="primary" size="sm" onClick={handleAdd}>
          + Agregar variable
        </Button>
      </div>
    </div>
  );
}
