"use client";

import { InfoIcon, LockKeyIcon, XIcon } from "@phosphor-icons/react";
import { useState } from "react";

import { Button } from "@/components/ui/atoms/Button";
import { Select, SelectOption } from "@/components/ui/atoms/Select";
import { hasCharRun, repeatedWords } from "@/lib/utils/safe-text";
import { toSnakeIdentifier } from "@/lib/utils/slug";
import { unidadesParaTipo } from "@/lib/utils/unidades-por-tipo";
import type { TipoVariableOption } from "@/types/servicios";

import { Icon } from "../atoms/Icon";
import { Toggle } from "../atoms/Toggle";

export type ConstanteDraft = {
  nombre_constante: string;
  origen: "global" | "manual";
  valor?: number;
  id_tipo_variable?: number;
  unidad?: string;
};

type ConstantesSectionProps = {
  tiposDisponibles: TipoVariableOption[];
  constantes: ConstanteDraft[];
  onChange: (constantes: ConstanteDraft[]) => void;
};

const MAX_NOMBRE_LEN = 30;
const MAX_VALOR_DIGITOS = 8;

// Stored value = short symbol. Label = verbose description shown in the dropdown only.
const UNIT_OPTIONS = [
  { value: "$", label: "$ - pesos" },
  { value: "cm", label: "cm - centímetros" },
  { value: "cm²", label: "cm² - centímetros cuadrados" },
  { value: "m", label: "m - metros" },
  { value: "m²", label: "m² - metros cuadrados" },
  { value: "pz", label: "pz - piezas" },
  { value: "min", label: "min - minutos" },
  { value: "h", label: "h - horas" },
  { value: "%", label: "% - porcentaje" },
  { value: "u", label: "u - unidades" },
] as const;

const getTipoUnidad = (id: number, tipos: TipoVariableOption[]) => {
  const tipo = tipos.find((t) => t.id_tipo_variable === id);
  return tipo?.unidad_default ?? "u";
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
    if (!/^[A-Za-záéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(draft.etiqueta.trim())) {
      setError("El nombre solo puede contener letras");
      return;
    }
    if (hasCharRun(draft.etiqueta)) {
      setError("El nombre tiene letras repetidas sin coherencia.");
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
    if (valorParsed > 999999.99) {
      setError("El valor no puede superar 999,999.99");
      return;
    }
    const dotIdx = draft.valor.indexOf(".");
    if (dotIdx !== -1 && draft.valor.length - dotIdx - 1 > 2) {
      setError("Máximo 2 decimales permitidos");
      return;
    }

    onChange([
      ...constantes,
      {
        nombre_constante: nombre,
        origen: "manual",
        valor: valorParsed,
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
      c.valor != null ? `${c.valor}${c.unidad ? ` ${c.unidad}` : ""}` : null,
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
                  {c.origen === "global" && <Icon LibIcon={LockKeyIcon} size={12} weight="bold" />}
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
                <span className="text-gray-400 font-normal">
                  (máx. {MAX_NOMBRE_LEN} caracteres)
                </span>
              </label>
              <input
                type="text"
                placeholder="Ej. Markup de mostrador"
                value={draft.etiqueta}
                onChange={(e) => {
                  const next = e.target.value
                    .normalize("NFC")
                    .replace(/[^A-Za-záéíóúÁÉÍÓÚñÑüÜ ]/gu, "");
                  setDraft((d) => ({ ...d, etiqueta: next }));
                }}
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
                Valor de la constante{" "}
                <span className="text-gray-400 font-normal">
                  (máx. {MAX_VALOR_DIGITOS} dígitos)
                </span>
              </label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="Ej. 1.4"
                value={draft.valor}
                onChange={(e) => {
                  // Only allow digits with at most one decimal point, capped at
                  // MAX_VALOR_DIGITOS digits (the dot doesn't count). Reject letters,
                  // scientific notation, signs, and anything else type="number" would
                  // let slip through via paste or "e" key.
                  const next = e.target.value;
                  const digitCount = next.replace(/\./g, "").length;
                  if (
                    next === "" ||
                    (/^\d*\.?\d{0,2}$/.test(next) && digitCount <= MAX_VALOR_DIGITOS)
                  ) {
                    setDraft((d) => ({ ...d, valor: next }));
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
                    // units appear (e.g. cm/m for Dimensión, $ for Costo). If
                    // the tipo is unknown, fall back to all units.
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

            {error && <p className="text-sm text-[#e42200]">{error}</p>}

            <Button type="button" variant="primary" size="sm" onClick={handleAdd}>
              + Agregar constante
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
