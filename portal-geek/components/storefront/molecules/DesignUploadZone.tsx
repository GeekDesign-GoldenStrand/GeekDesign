"use client";

import { CloudArrowUp, File } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";

import { deleteFile, uploadDesignFile } from "@/lib/utils/upload";

const ACCEPTED = ".svg,.png,.jpg,.jpeg,.ai,.eps,.dxf,.pdf";
const MB = 1024 * 1024;

// Estado interno de cada slot de archivo (todos tienen `file`)
type SlotState =
  | { id: string; status: "uploading"; file: File }
  | { id: string; status: "done"; file: File; key: string }
  | { id: string; status: "error"; file: File; message: string };

interface Props {
  maxFiles?: number;
  maxBytes?: number;
  // Devuelve los keys ya subidos cada vez que cambia la lista
  onKeysChange?: (keys: string[]) => void;
}

export function DesignUploadZone({ maxFiles = 1, maxBytes = 10 * MB, onKeysChange }: Props) {
  const [slots, setSlots] = useState<SlotState[]>([]);
  const [dragging, setDragging] = useState(false);
  const [sizeError, setSizeError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Ref para evitar que onKeysChange (arrow fn del padre) cause re-renders innecesarios
  const onKeysChangeRef = useRef(onKeysChange);
  useEffect(() => {
    onKeysChangeRef.current = onKeysChange;
  });

  // Notifica al padre cada vez que cambia la lista de slots — fuera del render
  useEffect(() => {
    const keys = slots
      .filter((s): s is Extract<SlotState, { status: "done" }> => s.status === "done")
      .map((s) => s.key);
    onKeysChangeRef.current?.(keys);
  }, [slots]);

  async function handleFile(f: File) {
    if (f.size > maxBytes) {
      setSizeError(
        `"${f.name}" supera el límite de ${maxBytes / MB} MB (${(f.size / MB).toFixed(1)} MB).`
      );
      return;
    }
    setSizeError(null);

    // ID estable generado antes del upload — evita la carrera de leer slots.length
    // (estado potencialmente stale) y luego actualizar por posición.
    const slotId = crypto.randomUUID();
    setSlots((prev) => [...prev, { id: slotId, status: "uploading", file: f }]);

    try {
      const key = await uploadDesignFile(f);
      setSlots((prev) =>
        prev.map((s) => (s.id === slotId ? { id: slotId, status: "done", file: f, key } : s))
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al subir el archivo";
      setSlots((prev) =>
        prev.map((s) => (s.id === slotId ? { id: slotId, status: "error", file: f, message } : s))
      );
    }
  }

  async function removeSlot(id: string) {
    const slot = slots.find((s) => s.id === id);
    // Si ya subió, borrar el orphan del bucket
    if (slot?.status === "done") {
      deleteFile(slot.key).catch(() => {
        // best-effort: si falla el delete el bucket lo limpiará con GC
      });
    }
    setSlots((prev) => prev.filter((s) => s.id !== id));
    if (inputRef.current) inputRef.current.value = "";
    setSizeError(null);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (slots.length >= maxFiles) return;
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  const canAddMore = slots.length < maxFiles;
  const showDropZone = slots.length === 0;

  return (
    <div className="w-full flex flex-col gap-[8px]">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          if (inputRef.current) inputRef.current.value = "";
        }}
      />

      {/* Lista de slots */}
      {slots.map((slot) => (
        <div
          key={slot.id}
          className={`border border-dashed rounded-[10px] px-[16px] py-[12px] flex items-center gap-[10px] ${
            slot.status === "error"
              ? "border-[#c14a4a] bg-[#fff5f5]"
              : "border-[#8b434a] bg-[#fff5f6]"
          }`}
        >
          {slot.status === "uploading" ? (
            // Spinner
            <svg
              className="animate-spin shrink-0 text-[#8b434a]"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
          ) : (
            <File
              size={20}
              className={slot.status === "error" ? "text-[#c14a4a]" : "text-[#8b434a]"}
              weight="regular"
            />
          )}

          <div className="flex-1 min-w-0">
            <span className="text-[13px] text-[#1e1e1e] block truncate">{slot.file.name}</span>
            {slot.status === "uploading" && (
              <span className="text-[11px] text-[#888]">Subiendo…</span>
            )}
            {slot.status === "done" && <span className="text-[11px] text-[#2e7d32]">✓ Subido</span>}
            {slot.status === "error" && (
              <span className="text-[11px] text-[#c14a4a]">{slot.message}</span>
            )}
          </div>

          <span className="text-[11px] text-[#999] shrink-0">
            {(slot.file.size / MB).toFixed(1)} MB
          </span>

          <button
            type="button"
            onClick={() => removeSlot(slot.id)}
            aria-label="Quitar archivo"
            disabled={slot.status === "uploading"}
            className="shrink-0 text-[#999] hover:text-[#1e1e1e] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path
                d="M12 4L4 12M4 4l8 8"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      ))}

      {/* Error de tamaño */}
      {sizeError && <p className="text-[12px] text-[#c14a4a]">{sizeError}</p>}

      {/* Zona drag & drop — solo cuando no hay slots */}
      {showDropZone && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`cursor-pointer select-none rounded-[10px] border-2 border-dashed px-[20px] py-[20px] flex flex-col items-center justify-center gap-[6px] transition-colors ${
            dragging ? "border-[#8b434a] bg-[#fff0f1]" : "border-[#b0b8d1]"
          }`}
          style={
            dragging
              ? undefined
              : {
                  backgroundImage:
                    "repeating-linear-gradient(0deg,transparent,transparent 19px,#dde3f0 19px,#dde3f0 20px),repeating-linear-gradient(90deg,transparent,transparent 19px,#dde3f0 19px,#dde3f0 20px)",
                  backgroundColor: "#f4f6fb",
                }
          }
        >
          <CloudArrowUp
            size={30}
            weight="thin"
            className={dragging ? "text-[#8b434a]" : "text-[#6b7280]"}
          />
          <p className="font-semibold text-[14px] text-[#1e1e1e]">Sube tu diseño</p>
          <p className="text-[12px] text-[#555] text-center leading-snug">
            Arrastra tu archivo aquí o selecciónalo desde tu equipo.
          </p>
          <p className="text-[11px] text-[#888]">
            Formatos: SVG, PNG, JPG, AI, EPS, DXF, PDF · Máx {maxBytes / MB} MB
          </p>
        </div>
      )}

      {/* Botón agregar más */}
      {slots.length > 0 && canAddMore && maxFiles > 1 && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-[6px] text-[13px] font-medium text-[#8b434a] hover:text-[#7a3a41] transition-colors self-start"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Agregar otro archivo
          <span className="text-[#999] font-normal">
            ({slots.length}/{maxFiles})
          </span>
        </button>
      )}

      {slots.length === maxFiles && maxFiles > 1 && (
        <p className="text-[12px] text-[#888]">Límite de {maxFiles} archivos alcanzado.</p>
      )}
    </div>
  );
}
