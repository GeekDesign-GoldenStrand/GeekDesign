"use client";

import { CloudArrowUp, Trash, Warning } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";

import { deleteFile, uploadFile } from "@/lib/utils/upload";

interface SlotState {
  id: string;
  status: "uploading" | "done" | "error";
  file?: File;
  key?: string;
  previewUrl: string;
  errorMsg?: string;
}

interface ServiciosImagesInputProps {
  initialKeys?: string[];
  onKeysChange: (keys: string[]) => void;
  onError: (message: string) => void;
  disabled?: boolean;
}

const ACCEPT = "image/jpeg,image/png,image/webp";
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_FILES = 5;

export function ServiciosImagesInput({
  initialKeys = [],
  onKeysChange,
  onError,
  disabled,
}: ServiciosImagesInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [slots, setSlots] = useState<SlotState[]>([]);
  const [dragging, setDragging] = useState(false);

  // Initialize slots from initialKeys (saved images)
  useEffect(() => {
    if (initialKeys.length === 0) {
      setSlots([]);
    } else if (slots.length === 0) {
      setSlots(
        initialKeys.map((key) => ({
          id: key,
          status: "done",
          key,
          previewUrl: key.startsWith("/") || /^https?:\/\//i.test(key) ? key : `/api/images/${key}`,
        }))
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialKeys]);

  // Propagate key changes up when done slots change
  useEffect(() => {
    const doneKeys = slots.filter((s) => s.status === "done" && s.key).map((s) => s.key!);
    onKeysChange(doneKeys);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots]);

  // Clean up object URLs on unmount
  useEffect(
    () => () => {
      slots.forEach((s) => {
        if (s.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(s.previewUrl);
        }
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  async function handleUpload(file: File) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      onError("Formato no permitido. Usa JPG, PNG o WebP.");
      return;
    }
    if (file.size > MAX_BYTES) {
      onError(`La imagen "${file.name}" excede el tamaño máximo (10 MB).`);
      return;
    }

    const slotId = crypto.randomUUID();
    const previewUrl = URL.createObjectURL(file);

    setSlots((prev) => [
      ...prev,
      {
        id: slotId,
        status: "uploading",
        file,
        previewUrl,
      },
    ]);

    try {
      const key = await uploadFile(file, "servicios");
      setSlots((prev) => prev.map((s) => (s.id === slotId ? { ...s, status: "done", key } : s)));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al subir la imagen";
      onError(`Fallo al subir "${file.name}": ${msg}`);
      setSlots((prev) =>
        prev.map((s) => (s.id === slotId ? { ...s, status: "error", errorMsg: msg } : s))
      );
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const spacesLeft = MAX_FILES - slots.filter((s) => s.status !== "error").length;
    const toUpload = files.slice(0, spacesLeft);

    if (files.length > spacesLeft) {
      onError(`Límite máximo de ${MAX_FILES} imágenes alcanzado.`);
    }

    toUpload.forEach((file) => handleUpload(file));

    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleRemove(slotId: string) {
    const slot = slots.find((s) => s.id === slotId);
    if (!slot) return;

    // Clean up S3 object if it was uploaded successfully in this session
    if (slot.status === "done" && slot.key) {
      // fire-and-forget delete call
      deleteFile(slot.key).catch(() => {});
    }

    // Revoke blob URL if exists
    if (slot.previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(slot.previewUrl);
    }

    setSlots((prev) => prev.filter((s) => s.id !== slotId));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const spacesLeft = MAX_FILES - slots.filter((s) => s.status !== "error").length;
    const toUpload = files.slice(0, spacesLeft);

    if (files.length > spacesLeft) {
      onError(`Límite máximo de ${MAX_FILES} imágenes alcanzado.`);
    }

    toUpload.forEach((file) => handleUpload(file));
  }

  const activeSlotsCount = slots.filter((s) => s.status !== "error").length;
  const canAddMore = activeSlotsCount < MAX_FILES;

  return (
    <div className="space-y-3">
      <label className="block text-[14px] font-medium text-[#1e1e1e]">Imágenes del servicio:</label>

      {/* Grid showing current images */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {slots.map((slot) => (
          <div
            key={slot.id}
            className={`relative aspect-square border rounded-lg overflow-hidden flex flex-col items-center justify-center bg-gray-50 group ${
              slot.status === "error" ? "border-red-300" : "border-gray-200"
            }`}
          >
            {/* Image Preview */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slot.previewUrl}
              alt="Preview"
              className={`w-full h-full object-cover ${
                slot.status === "uploading" ? "opacity-50" : ""
              }`}
            />

            {/* Uploading Overlay */}
            {slot.status === "uploading" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60">
                <svg
                  className="animate-spin text-[#8b434a] mb-1"
                  width="24"
                  height="24"
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
                <span className="text-[11px] font-medium text-[#8b434a]">Subiendo...</span>
              </div>
            )}

            {/* Error Overlay */}
            {slot.status === "error" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50/90 p-2 text-center">
                <Warning size={20} className="text-red-500 mb-1" />
                <span className="text-[10px] text-red-700 leading-tight line-clamp-2">
                  {slot.errorMsg || "Error"}
                </span>
              </div>
            )}

            {/* Delete button (overlay on hover) */}
            {!disabled && slot.status !== "uploading" && (
              <button
                type="button"
                onClick={() => handleRemove(slot.id)}
                className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1.5 shadow-md hover:bg-red-700 active:scale-95 transition-all md:opacity-0 md:group-hover:opacity-100"
                aria-label="Eliminar imagen"
              >
                <Trash size={14} />
              </button>
            )}
          </div>
        ))}

        {/* Upload Trigger / Dropzone */}
        {!disabled && canAddMore && (
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
            className={`aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer p-4 transition-colors select-none ${
              dragging
                ? "border-[#8b434a] bg-[#fff8f9]"
                : "border-gray-300 hover:border-[#8b434a] bg-gray-50"
            }`}
          >
            <CloudArrowUp
              size={32}
              weight="thin"
              className={dragging ? "text-[#8b434a]" : "text-gray-400"}
            />
            <span className="text-[12px] font-semibold text-gray-700 mt-2 text-center leading-tight">
              Añadir imagen
            </span>
            <span className="text-[10px] text-gray-400 mt-1 text-center">
              JPG, PNG, WebP · Max 10MB ({activeSlotsCount}/{MAX_FILES})
            </span>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT}
        onChange={handleFileSelect}
        disabled={disabled}
        className="hidden"
      />
    </div>
  );
}
