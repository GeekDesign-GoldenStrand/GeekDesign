"use client";

import { InfoIcon, LockKeyIcon, XIcon } from "@phosphor-icons/react";
import { useState } from "react";

import { toSnakeIdentifier } from "@/lib/utils/slug";
import type { InstaladorOption, ProveedorOption } from "@/types/servicios";

import { Icon } from "../atoms/Icon";

// User-selectable origins in the manual add form. 'global' (used by the
// auto-created IVA) is hidden — admins don't pick it manually.
type OrigenManual = "instalador" | "proveedor" | "manual";

export type ConstanteDraft = {
  nombre_constante: string;
  origen: "instalador" | "proveedor" | "global" | "manual";
  id_instalador?: number;
  id_proveedor?: number;
  // Auto-managed by the page (instalador/proveedor toggles, IVA when formula on).
  // Can't be edited or deleted from the UI.
  auto?: boolean;
};

type ConstantesSectionProps = {
  instaladoresDisponibles: InstaladorOption[];
  proveedoresDisponibles: ProveedorOption[];
  constantes: ConstanteDraft[];
  onChange: (constantes: ConstanteDraft[]) => void;
};

const MAX_NOMBRE_LEN = 30;

const ORIGEN_LABELS: Record<OrigenManual, string> = {
  manual: "Lo defino yo (valor fijo en la fórmula)",
  instalador: "Es el costo de un instalador específico",
  proveedor: "Es el costo de un proveedor específico",
};

export function ConstantesSection({
  instaladoresDisponibles,
  proveedoresDisponibles,
  constantes,
  onChange,
}: ConstantesSectionProps) {
  // Track which origins are already covered by an auto constante so we can
  // hide them from the manual add dropdown — Andrea doesn't need to add
  // a "costo del instalador" manually if the toggle above already did it.
  const yaHayInstaladorAuto = constantes.some((c) => c.auto && c.origen === "instalador");
  const yaHayProveedorAuto = constantes.some((c) => c.auto && c.origen === "proveedor");

  // Build the available origin options dynamically.
  const origenesDisponibles: OrigenManual[] = [
    "manual",
    ...(!yaHayInstaladorAuto ? (["instalador"] as OrigenManual[]) : []),
    ...(!yaHayProveedorAuto ? (["proveedor"] as OrigenManual[]) : []),
  ];

  const [draft, setDraft] = useState<{
    etiqueta: string;
    origen: OrigenManual;
    id_instalador?: number;
    id_proveedor?: number;
  }>({
    etiqueta: "",
    origen: "manual",
  });

  const [error, setError] = useState<string | null>(null);

  const previewNombre = draft.etiqueta
    ? toSnakeIdentifier(draft.etiqueta).slice(0, MAX_NOMBRE_LEN)
    : "";

  // Derive the effective origen: if the user's draft origen is no longer
  // available (auto constant was added), fall back to "manual" without
  // mutating state during render.
  const effectiveOrigen: OrigenManual = origenesDisponibles.includes(draft.origen)
    ? draft.origen
    : "manual";

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
    // Block manual add of names that collide with auto-managed ones.
    if (nombre === "costo_instalador" || nombre === "costo_proveedor" || nombre === "iva") {
      setError(`"${nombre}" es un nombre reservado para constantes automáticas.`);
      return;
    }
    if (constantes.some((c) => c.nombre_constante === nombre)) {
      setError(`Ya existe una constante con el identificador "${nombre}". Usa un nombre distinto.`);
      return;
    }
    if (effectiveOrigen === "instalador" && !draft.id_instalador) {
      setError("Selecciona un instalador");
      return;
    }
    if (effectiveOrigen === "proveedor" && !draft.id_proveedor) {
      setError("Selecciona un proveedor");
      return;
    }

    const cleaned: ConstanteDraft = {
      nombre_constante: nombre,
      origen: effectiveOrigen,
      ...(effectiveOrigen === "instalador" ? { id_instalador: draft.id_instalador } : {}),
      ...(effectiveOrigen === "proveedor" ? { id_proveedor: draft.id_proveedor } : {}),
    };

    onChange([...constantes, cleaned]);
    setDraft({ etiqueta: "", origen: "manual" });
  };

  const handleRemove = (nombre: string) => {
    onChange(constantes.filter((c) => c.nombre_constante !== nombre));
  };

  const origenDescripcion = (c: ConstanteDraft): string => {
    switch (c.origen) {
      case "instalador": {
        const inst = instaladoresDisponibles.find((i) => i.id_instalador === c.id_instalador);
        return `Costo de ${inst?.nombre_instalador ?? "?"}`;
      }
      case "proveedor": {
        const prov = proveedoresDisponibles.find((p) => p.id_proveedor === c.id_proveedor);
        return `Costo de ${prov?.nombre_proveedor ?? "?"}`;
      }
      case "global":
        // For now, the only auto-global is IVA.
        if (c.nombre_constante === "iva") return "16% — se aplica al final";
        return "Constante del sistema";
      case "manual":
        return "Valor fijo (en la fórmula)";
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h3 className="text-lg font-semibold text-[#1e1e1e]">Constantes:</h3>
        <p className="text-sm text-gray-600 mt-1">
          Valores fijos asociados al servicio. Las marcadas con candado se gestionan
          automáticamente. (Ejemplos: costo del instalador, costo del proveedor)
        </p>
        <p className="text-sm text-gray-500 italic mt-1">Ejemplos: markup, etc.</p>
      </div>

      {/* Chips list */}
      {constantes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {constantes.map((c) => (
            <div
              key={c.nombre_constante}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                c.auto
                  ? "bg-blue-100 text-blue-900 border border-blue-300"
                  : "bg-[#fce4e4] text-[#e42200] border border-[#fce4e4]"
              }`}
              title={origenDescripcion(c)}
            >
              {c.auto && <Icon LibIcon={LockKeyIcon} size={12} weight="bold" />}
              <span className="font-mono">{c.nombre_constante}</span>
              <span className="text-sm opacity-70">{origenDescripcion(c)}</span>
              {!c.auto && (
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
            ¿De dónde viene el valor de esta constante?
          </label>
          <select
            value={effectiveOrigen}
            onChange={(e) =>
              setDraft({
                etiqueta: draft.etiqueta,
                origen: e.target.value as OrigenManual,
              })
            }
            className="h-9 px-2 rounded-md border border-gray-300 bg-white text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#e42200]"
          >
            {origenesDisponibles.map((o) => (
              <option key={o} value={o}>
                {ORIGEN_LABELS[o]}
              </option>
            ))}
          </select>
        </div>

        {effectiveOrigen === "instalador" && (
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Instalador</label>
            <select
              value={draft.id_instalador ?? ""}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  id_instalador: Number(e.target.value),
                }))
              }
              className="h-9 px-2 rounded-md border border-gray-300 bg-white text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#e42200]"
            >
              <option value="">Selecciona</option>
              {instaladoresDisponibles.map((i) => (
                <option key={i.id_instalador} value={i.id_instalador}>
                  {i.nombre_instalador} — ${i.costo_instalacion}
                </option>
              ))}
            </select>
          </div>
        )}

        {effectiveOrigen === "proveedor" && (
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Proveedor</label>
            <select
              value={draft.id_proveedor ?? ""}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  id_proveedor: Number(e.target.value),
                }))
              }
              className="h-9 px-2 rounded-md border border-gray-300 bg-white text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#e42200]"
            >
              <option value="">Selecciona...</option>
              {proveedoresDisponibles.map((p) => (
                <option key={p.id_proveedor} value={p.id_proveedor}>
                  {p.nombre_proveedor}
                  {p.costo !== null && ` — $${p.costo}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {effectiveOrigen === "manual" && (
          <p className="text-sm text-gray-500 italic">
            El valor lo escribes directamente en la fórmula. Ej:{" "}
            <code className="bg-gray-100 px-1 rounded">* 1.4</code> para 40% de comisión.
          </p>
        )}

        {error && <p className="text-sm text-[#e42200]">{error}</p>}

        <button
          type="button"
          onClick={handleAdd}
          className="h-10 px-5 bg-[#e42200] text-white hover:bg-[#c41e00] rounded-full text-sm font-medium transition-colors"
        >
          + Agregar constante
        </button>
      </div>
    </div>
  );
}
