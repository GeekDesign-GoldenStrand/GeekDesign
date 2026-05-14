"use client";

import { CloudArrowUp, File, X } from "@phosphor-icons/react";
import { useRef, useState } from "react";

interface Props {
  onFileChange?: (file: File | null) => void;
}

const ACCEPTED = ".svg,.png,.jpg,.jpeg,.ai,.eps,.dxf,.pdf";

export function DesignUploadZone({ onFileChange }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File) {
    setFile(f);
    onFileChange?.(f);
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    setFile(null);
    onFileChange?.(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />

      {file ? (
        <div className="border border-dashed border-[#8b434a] rounded-[10px] px-[16px] py-[12px] flex items-center gap-[10px] bg-[#fff5f6]">
          <File size={20} className="text-[#8b434a] shrink-0" />
          <span className="text-[13px] text-[#1e1e1e] flex-1 truncate">{file.name}</span>
          <button
            type="button"
            onClick={handleClear}
            aria-label="Quitar archivo"
            className="shrink-0 text-[#999] hover:text-[#1e1e1e] transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
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
            dragging
              ? "border-[#8b434a] bg-[#fff0f1]"
              : "border-[#b0b8d1] bg-[#f4f6fb]"
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
    </div>
  );
}
