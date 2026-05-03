"use client";

import { useState } from "react";

import { Icon } from "../atoms/Icon";
import { TrashIcon } from "@phosphor-icons/react";

import type { TipoVariableOption } from "@/types/servicios";

// Variable shape used inside the form (mirrors the Zod schema in lib/schemas/servicios.ts).
export type VariableDraft = {
  id_tipo_variable: number;
  nombre_variable: string;
  etiqueta: string;
  valor_default?: string;
  editable_por_cliente: boolean;
  unidad?: string;
};

type VariablesSectionProps = {
  // Available variable types from the seed (Dimensión, Cantidad, etc.)
  tiposDisponibles: TipoVariableOption[];
  // Current list of variables added to the formula.
  variables: VariableDraft[];
  // Callback when the list changes.
  onChange: (variables: VariableDraft[]) => void;
};

export function VariablesSection({
  tiposDisponibles,
  variables,
  onChange,
}: VariablesSectionProps) {
  // Form state for the "add new variable" inline form.
  const [draft, setDraft] = useState<VariableDraft>({
    id_tipo_variable: tiposDisponibles[0]?.id_tipo_variable ?? 0,
    nombre_variable: "",
    etiqueta: "",
    valor_default: "",
    editable_por_cliente: false,
    unidad: "",
  });

  const [error, setError] = useState<string | null>(null);

  // Validation: identifier-style name + non-empty label + unique within the list.
  const handleAdd = () => {
    setError(null);

    if (!draft.nombre_variable.trim()) {
      setError("El nombre técnico es obligatorio");
      return;
    }
    if (!/^[a-z_][a-z0-9_]*$/.test(draft.nombre_variable)) {
      setError(
        "Nombre técnico debe ser solo minúsculas, números y guiones bajos (ej. ancho_cm)"
      );
      return;
    }
    if (!draft.etiqueta.trim()) {
      setError("La etiqueta visible es obligatoria");
      return;
    }
    if (variables.some((v) => v.nombre_variable === draft.nombre_variable)) {
      setError("Ya existe una variable con ese nombre técnico");
      return;
    }
    if (draft.id_tipo_variable === 0) {
      setError("Selecciona un tipo de variable");
      return;
    }

    onChange([...variables, { ...draft }]);

    // Reset draft for next addition.
    setDraft({
      id_tipo_variable: tiposDisponibles[0]?.id_tipo_variable ?? 0,
      nombre_variable: "",
      etiqueta: "",
      valor_default: "",
      editable_por_cliente: false,
      unidad: "",
    });
  };

  const handleRemove = (nombreVariable: string) => {
    onChange(variables.filter((v) => v.nombre_variable !== nombreVariable));
  };

  const tipoNombre = (id: number) =>
    tiposDisponibles.find((t) => t.id_tipo_variable === id)?.nombre_tipo ??
    "Desconocido";

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-[#1e1e1e]">Variables</h3>
      <p className="text-xs text-gray-500 -mt-2">
        Datos que se capturan al cotizar (ej. ancho, alto, cantidad).
      </p>

      {/* Existing variables list */}
      {variables.length > 0 && (
        <div className="flex flex-col gap-2">
          {variables.map((v) => (
            <div
              key={v.nombre_variable}
              className="flex items-center justify-between gap-2 bg-gray-50 px-3 py-2 rounded-md border border-gray-200"
            >
              <div className="flex flex-col text-sm">
                <span className="font-medium text-[#1e1e1e]">
                  {v.etiqueta}{" "}
                  <code className="text-xs text-gray-500">
                    ({v.nombre_variable})
                  </code>
                </span>
                <span className="text-xs text-gray-500">
                  {tipoNombre(v.id_tipo_variable)}
                  {v.unidad ? ` · ${v.unidad}` : ""}
                  {v.editable_por_cliente
                    ? " · Editable por cliente"
                    : " · No editable"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(v.nombre_variable)}
                className="text-gray-400 hover:text-[#e42200] p-1"
                aria-label={`Eliminar variable ${v.etiqueta}`}
              >
                <Icon LibIcon={TrashIcon} size={16} weight="bold" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Inline form to add a new variable */}
      <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-md border border-dashed border-gray-300">
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            placeholder="Nombre técnico (ej. ancho_cm)"
            value={draft.nombre_variable}
            onChange={(e) =>
              setDraft((d) => ({ ...d, nombre_variable: e.target.value }))
            }
            className="h-9 px-2 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#e42200]"
            maxLength={100}
          />
          <input
            type="text"
            placeholder="Etiqueta visible (ej. Ancho)"
            value={draft.etiqueta}
            onChange={(e) =>
              setDraft((d) => ({ ...d, etiqueta: e.target.value }))
            }
            className="h-9 px-2 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#e42200]"
            maxLength={100}
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <select
            value={draft.id_tipo_variable}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                id_tipo_variable: Number(e.target.value),
              }))
            }
            className="h-9 px-2 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#e42200]"
          >
            <option value={0}>Tipo...</option>
            {tiposDisponibles.map((t) => (
              <option key={t.id_tipo_variable} value={t.id_tipo_variable}>
                {t.nombre_tipo}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Unidad (cm, pz)"
            value={draft.unidad ?? ""}
            onChange={(e) =>
              setDraft((d) => ({ ...d, unidad: e.target.value }))
            }
            className="h-9 px-2 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#e42200]"
            maxLength={20}
          />

          <input
            type="text"
            placeholder="Default"
            value={draft.valor_default ?? ""}
            onChange={(e) =>
              setDraft((d) => ({ ...d, valor_default: e.target.value }))
            }
            className="h-9 px-2 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#e42200]"
          />
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