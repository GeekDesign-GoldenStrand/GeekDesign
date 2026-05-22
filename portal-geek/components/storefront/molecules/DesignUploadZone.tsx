"use client";

import { CloudArrowUp, File } from "@phosphor-icons/react";
import { useRef, useState } from "react";

const ACCEPTED = ".svg,.png,.jpg,.jpeg,.ai,.eps,.dxf,.pdf";
const MB = 1024 * 1024;

interface Props {
  maxFiles?: number;
  maxBytes?: number;
  onFileChange?: (files: File[]) => void;
}

export function DesignUploadZone({ maxFiles = 1, maxBytes = 10 * MB, onFileChange }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [sizeError, setSizeError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function tryAddFile(f: File) {
    if (f.size > maxBytes) {
      setSizeError(
        `"${f.name}" supera el límite de ${maxBytes / MB} MB (${(f.size / MB).toFixed(1)} MB).`
      );
      return;
    }
    setSizeError(null);
    const updated = [...files, f];
    setFiles(updated);
    onFileChange?.(updated);
  }

  function removeFile(index: number) {
    setSizeError(null);
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    onFileChange?.(updated);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (files.length >= maxFiles) return;
    const f = e.dataTransfer.files[0];
    if (f) tryAddFile(f);
  }

  const canAddMore = files.length < maxFiles;

  return (
    <div className="w-full flex flex-col gap-[8px]">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) tryAddFile(f);
          if (inputRef.current) inputRef.current.value = "";
        }}
      />

      {/* Archivos seleccionados */}
      {files.map((f, i) => (
        <div
          key={i}
          className="border border-dashed border-[#8b434a] rounded-[10px] px-[16px] py-[12px] flex items-center gap-[10px] bg-[#fff5f6]"
        >
          <File size={20} className="text-[#8b434a] shrink-0" />
          <span className="text-[13px] text-[#1e1e1e] flex-1 truncate">{f.name}</span>
          <span className="text-[11px] text-[#999] shrink-0">{(f.size / MB).toFixed(1)} MB</span>
          <button
            type="button"
            onClick={() => removeFile(i)}
            aria-label="Quitar archivo"
            className="shrink-0 text-[#999] hover:text-[#1e1e1e] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      ))}

      {/* Error de tamaño */}
      {sizeError && (
        <p className="text-[12px] text-[#c14a4a]">{sizeError}</p>
      )}

      {/* Zona drag & drop — solo cuando no hay archivos todavía */}
      {files.length === 0 && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
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
          <p className="text-[11px] text-[#888]">Formatos sugeridos: SVG, PNG, JPG.</p>
        </div>
      )}

      {/* Botón agregar más — solo si maxFiles > 1 y aún se puede */}
      {files.length > 0 && canAddMore && maxFiles > 1 && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-[6px] text-[13px] font-medium text-[#8b434a] hover:text-[#7a3a41] transition-colors self-start"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Agregar otro archivo
          <span className="text-[#999] font-normal">({files.length}/{maxFiles})</span>
        </button>
      )}

      {/* Límite alcanzado */}
      {files.length === maxFiles && maxFiles > 1 && (
        <p className="text-[12px] text-[#888]">Límite de {maxFiles} archivos alcanzado.</p>
      )}
    </div>
  );
}
