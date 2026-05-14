"use client";

import { CloudArrowUp, File } from "@phosphor-icons/react";
import { useRef, useState } from "react";

interface Props {
  //TODO
  onFileChange?: (files: File[]) => void;
}

const ACCEPTED = ".svg,.png,.jpg,.jpeg,.ai,.eps,.dxf,.pdf";
const MAX_FILES = 5;

export function DesignUploadZone({ onFileChange }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function addFile(f: File) {
    const updated = [...files, f];
    setFiles(updated);
    onFileChange?.(updated);
  }

  function removeFile(index: number) {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    onFileChange?.(updated);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (files.length >= MAX_FILES) return;
    const f = e.dataTransfer.files[0];
    if (f) addFile(f);
  }

  const canAddMore = files.length < MAX_FILES;

  return (
    <div className="w-full flex flex-col gap-[8px]">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) addFile(f);
          if (inputRef.current) inputRef.current.value = "";
        }}
      />

      {/* List of already selected files */}
      {files.map((f, i) => (
        <div
          key={i}
          className="border border-dashed border-[#8b434a] rounded-[10px] px-[16px] py-[12px] flex items-center gap-[10px] bg-[#fff5f6]"
        >
          <File size={20} className="text-[#8b434a] shrink-0" />
          <span className="text-[13px] text-[#1e1e1e] flex-1 truncate">{f.name}</span>
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

      {/* Drag & drop zone — only if there are no files yet */}
      {files.length === 0 && (
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
            dragging ? "border-[#8b434a] bg-[#fff0f1]" : "border-[#b0b8d1] bg-[#f4f6fb]"
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

      {/* Add another file, only visible when there are files and more can be added */}
      {files.length > 0 && canAddMore && (
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
            ({files.length}/{MAX_FILES})
          </span>
        </button>
      )}

      {/* Limit indicator */}
      {files.length === MAX_FILES && (
        <p className="text-[12px] text-[#888]">Límite de {MAX_FILES} archivos alcanzado.</p>
      )}
    </div>
  );
}
