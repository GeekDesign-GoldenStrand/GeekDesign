"use client";

import { LockKeyIcon, XIcon } from "@phosphor-icons/react";
import { useEffect, useRef } from "react";

import { Toggle } from "@/components/admin/servicios/atoms/Toggle";
import type { FormulaChunk } from "@/types/servicios";

import { Icon } from "../atoms/Icon";
import type { ConstanteDraft } from "./ConstantesSection";
import type { VariableDraft } from "./VariablesSection";

// ── Types ──────────────────────────────────────────────────────────────────

type FormulaSectionProps = {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  chunks: FormulaChunk[];
  onChunksChange: (chunks: FormulaChunk[]) => void;
  variables: VariableDraft[];
  constantes: ConstanteDraft[];
  idInstalador: number | null;
  idProveedor: number | null;
};

// ── Invariant ─────────────────────────────────────────────────────────────
// chunks alternates [text, token, text, token, ..., text].
// text chunks are at even indices; tokens at odd indices.
// For a text chunk at chunkIdx i: textIdx = i / 2.

function tokenAlreadyIn(chunks: FormulaChunk[], value: string) {
  return chunks.some((c) => c.type === "token" && c.value === value);
}

const OPERATORS = ["+", "-", "*", "/", "(", ")"];

// ── Component ─────────────────────────────────────────────────────────────

export function FormulaSection({
  enabled,
  onToggle,
  chunks,
  onChunksChange,
  variables,
  constantes,
  idInstalador,
  idProveedor,
}: FormulaSectionProps) {
  const activeTextIdx = useRef<number>(0);
  const activeCursor = useRef<number>(0);
  const textInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const pendingFocusTextIdx = useRef<number | null>(null);
  const pendingFocusCursor = useRef<number | null>(null);

  useEffect(() => {
    if (pendingFocusTextIdx.current === null) return;
    const el = textInputRefs.current[pendingFocusTextIdx.current];
    if (el) {
      el.focus();
      const cur = pendingFocusCursor.current ?? el.value.length;
      el.setSelectionRange(cur, cur);
    }
    pendingFocusTextIdx.current = null;
    pendingFocusCursor.current = null;
  }, [chunks]);

  // ── Mutation helpers ────────────────────────────────────────────────────

  const insertToken = (value: string, immutable?: boolean) => {
    const cursor = activeCursor.current;
    const activeChunkIdx = activeTextIdx.current * 2;
    const currentText = chunks[activeChunkIdx]?.value ?? "";
    const before = currentText.slice(0, cursor);
    const after = currentText.slice(cursor);

    const newChunks: FormulaChunk[] = [
      ...chunks.slice(0, activeChunkIdx),
      { type: "text", value: before },
      { type: "token", value, ...(immutable ? { immutable: true } : {}) },
      { type: "text", value: after },
      ...chunks.slice(activeChunkIdx + 1),
    ];

    pendingFocusTextIdx.current = activeTextIdx.current + 1;
    pendingFocusCursor.current = 0;
    onChunksChange(newChunks);
  };

  const insertText = (char: string) => {
    const cursor = activeCursor.current;
    const activeChunkIdx = activeTextIdx.current * 2;
    const currentText = chunks[activeChunkIdx]?.value ?? "";
    const newValue = currentText.slice(0, cursor) + char + currentText.slice(cursor);

    pendingFocusTextIdx.current = activeTextIdx.current;
    pendingFocusCursor.current = cursor + char.length;
    onChunksChange(chunks.map((c, i) => (i === activeChunkIdx ? { ...c, value: newValue } : c)));
  };

  const removeToken = (tokenChunkIdx: number) => {
    const beforeText = chunks[tokenChunkIdx - 1]?.value ?? "";
    const afterText = chunks[tokenChunkIdx + 1]?.value ?? "";
    const merged = beforeText + afterText;
    const resultTextIdx = (tokenChunkIdx - 1) / 2;

    const newChunks: FormulaChunk[] = [
      ...chunks.slice(0, tokenChunkIdx - 1),
      { type: "text", value: merged },
      ...chunks.slice(tokenChunkIdx + 2),
    ];

    pendingFocusTextIdx.current = resultTextIdx;
    pendingFocusCursor.current = beforeText.length;
    onChunksChange(newChunks);
  };

  const updateText = (chunkIdx: number, value: string) => {
    onChunksChange(chunks.map((c, i) => (i === chunkIdx ? { ...c, value } : c)));
  };

  // ── Toggle ──────────────────────────────────────────────────────────────

  const handleToggle = (nextEnabled: boolean) => {
    if (nextEnabled && !tokenAlreadyIn(chunks, "iva")) {
      const lastIdx = chunks.length - 1;
      const lastText = chunks[lastIdx]?.value ?? "";
      const newChunks: FormulaChunk[] = [
        ...chunks.slice(0, lastIdx),
        { type: "text", value: lastText },
        { type: "token", value: "iva", immutable: true },
        { type: "text", value: "" },
      ];
      pendingFocusTextIdx.current = 0;
      onChunksChange(newChunks);
    }
    onToggle(nextEnabled);
  };

  // ── Derived ─────────────────────────────────────────────────────────────

  const terceros = [
    ...(idInstalador !== null ? [{ value: "costo_instalador", label: "Instalador" }] : []),
    ...(idProveedor !== null ? [{ value: "costo_proveedor", label: "Proveedor" }] : []),
  ];

  const formulaPreview = chunks.map((c) => c.value).join("").trim();
  const isEmptyFormula = chunks.length === 1 && chunks[0].value === "";

  const panelBtn =
    "text-sm border px-2.5 py-1 rounded font-mono transition-colors whitespace-nowrap";
  const panelBtnOn =
    "bg-white border-blue-300 hover:bg-blue-100 hover:border-blue-500 text-blue-900";
  const panelBtnOff =
    "bg-gray-100 text-gray-400 border-gray-200 cursor-default";

  const hasAnyTokens =
    variables.length > 0 || constantes.length > 0 || terceros.length > 0;

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-[#1e1e1e]">Fórmula:</h3>
        <Toggle checked={enabled} onChange={handleToggle} />
      </div>

      {enabled && (
        <>
          {/* ── Formula display — chips inline, no wrap ── */}
          <div
            className="rounded-xl border-2 border-gray-200 bg-white focus-within:border-[#e42200] transition-colors cursor-text overflow-x-auto"
            onClick={() => {
              const numText = Math.ceil(chunks.length / 2);
              textInputRefs.current[numText - 1]?.focus();
            }}
          >
            <div className="inline-flex items-center gap-1 px-3 py-2.5 min-w-full">
              {isEmptyFormula && (
                <span className="text-gray-400 text-sm font-mono select-none pointer-events-none">
                  escribe aquí…
                </span>
              )}

              {chunks.map((chunk, chunkIdx) => {
                if (chunk.type === "text") {
                  const textIdx = chunkIdx / 2;
                  return (
                    <input
                      key={chunkIdx}
                      ref={(el) => {
                        textInputRefs.current[textIdx] = el;
                      }}
                      type="text"
                      value={chunk.value}
                      // Stop propagation so container onClick doesn't steal focus
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        activeCursor.current =
                          e.target.selectionStart ?? e.target.value.length;
                        updateText(chunkIdx, e.target.value);
                      }}
                      onFocus={() => {
                        activeTextIdx.current = textIdx;
                        activeCursor.current =
                          textInputRefs.current[textIdx]?.selectionStart ?? 0;
                      }}
                      onKeyUp={(e) => {
                        activeCursor.current =
                          e.currentTarget.selectionStart ?? e.currentTarget.value.length;
                      }}
                      onMouseUp={(e) => {
                        activeCursor.current = e.currentTarget.selectionStart ?? 0;
                      }}
                      onBlur={(e) => {
                        activeCursor.current =
                          e.target.selectionStart ?? e.target.value.length;
                      }}
                      // Empty inputs stay 1.5ch so they remain clickable between chips
                      style={{
                        width:
                          chunk.value.length > 0 ? `${chunk.value.length + 0.5}ch` : "1.5ch",
                      }}
                      className="outline-none text-sm font-mono text-[#1e1e1e] bg-transparent shrink-0"
                    />
                  );
                }

                // Immutable token (IVA)
                if (chunk.immutable) {
                  return (
                    <span
                      key={chunkIdx}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-mono font-bold bg-blue-100 text-blue-900 border border-blue-200 select-none shrink-0"
                      title="Constante fija — no se puede eliminar"
                    >
                      <Icon LibIcon={LockKeyIcon} size={11} weight="bold" />
                      {chunk.value}
                    </span>
                  );
                }

                // Mutable token
                return (
                  <span
                    key={chunkIdx}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-mono font-bold bg-[#fce4e4] text-[#e42200] border border-[#fcc] shrink-0"
                  >
                    {chunk.value}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeToken(chunkIdx);
                      }}
                      className="hover:bg-[#e42200]/20 rounded-full p-0.5 transition-colors"
                      aria-label={`Quitar ${chunk.value}`}
                    >
                      <Icon LibIcon={XIcon} size={10} weight="bold" />
                    </button>
                  </span>
                );
              })}
            </div>
          </div>

          {formulaPreview && (
            <p className="text-sm text-gray-400 font-mono truncate" title={formulaPreview}>
              {formulaPreview}
            </p>
          )}

          {/* ── Compact token panel ── */}
          <div className="flex flex-col gap-2 p-2.5 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-700">
              Escribe{" "}
              <code className="bg-blue-100 px-1 rounded">+ - * / ( )</code>{" "}
              directo, o usa los botones de abajo.
            </p>

            {/* Variables */}
            {variables.length > 0 && (
              <div className="flex flex-wrap gap-1 items-center">
                <span className="text-sm text-blue-500 font-semibold mr-0.5">Vars:</span>
                {variables.map((v) => (
                  <button
                    key={v.nombre_variable}
                    type="button"
                    onClick={() => insertToken(v.nombre_variable)}
                    title={v.etiqueta}
                    className={`${panelBtn} ${panelBtnOn}`}
                  >
                    {v.nombre_variable}
                  </button>
                ))}
              </div>
            )}

            {/* Constantes */}
            {constantes.length > 0 && (
              <div className="flex flex-wrap gap-1 items-center">
                <span className="text-sm text-blue-500 font-semibold mr-0.5">Const:</span>
                {constantes.map((c) => {
                  const alreadyIn = tokenAlreadyIn(chunks, c.nombre_constante);
                  const isGlobal = c.origen === "global";
                  return (
                    <button
                      key={c.nombre_constante}
                      type="button"
                      disabled={alreadyIn}
                      onClick={() => {
                        if (!alreadyIn) insertToken(c.nombre_constante, isGlobal);
                      }}
                      title={
                        alreadyIn
                          ? "Ya en la fórmula"
                          : isGlobal
                          ? "Constante fija"
                          : undefined
                      }
                      className={`inline-flex items-center gap-0.5 ${panelBtn} ${
                        alreadyIn ? panelBtnOff : panelBtnOn
                      }`}
                    >
                      {isGlobal && <Icon LibIcon={LockKeyIcon} size={10} weight="bold" />}
                      {c.nombre_constante}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Terceros */}
            {terceros.length > 0 && (
              <div className="flex flex-wrap gap-1 items-center">
                <span className="text-sm text-blue-500 font-semibold mr-0.5">Terc:</span>
                {terceros.map((t) => {
                  const alreadyIn = tokenAlreadyIn(chunks, t.value);
                  return (
                    <button
                      key={t.value}
                      type="button"
                      disabled={alreadyIn}
                      onClick={() => {
                        if (!alreadyIn) insertToken(t.value);
                      }}
                      title={alreadyIn ? "Ya en la fórmula" : t.label}
                      className={`${panelBtn} ${alreadyIn ? panelBtnOff : panelBtnOn}`}
                    >
                      {t.value}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Operadores */}
            <div className="flex flex-wrap gap-1 items-center">
              <span className="text-xs text-blue-500 font-medium mr-0.5">Op:</span>
              {OPERATORS.map((op) => (
                <button
                  key={op}
                  type="button"
                  onClick={() => insertText(op)}
                  className={`${panelBtn} bg-white border-gray-300 hover:bg-gray-100 hover:border-gray-500 text-gray-800 font-bold text-base`}
                >
                  {op}
                </button>
              ))}
            </div>

            {!hasAnyTokens && (
              <p className="text-sm text-blue-400 italic">
                Define variables y constantes en las columnas de al lado.
              </p>
            )}
          </div>
        </>
      )}

      {!enabled && (
        <p className="text-sm text-gray-400 italic">
          Activa la fórmula para definir cómo se calcula el precio.
        </p>
      )}
    </div>
  );
}
