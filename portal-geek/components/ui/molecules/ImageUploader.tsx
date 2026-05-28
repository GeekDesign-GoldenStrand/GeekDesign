"use client";

import {
  CloudArrowUpIcon as CloudArrowUp,
  TrashIcon as Trash,
  WarningIcon as Warning,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState } from "react";

import { deleteFile, uploadFile } from "@/lib/utils/upload";

type UploadCategory = "materiales" | "servicios" | "disenios" | "notas";

interface SlotState {
  id: string;
  status: "uploading" | "done" | "error";
  key?: string;
  previewUrl: string;
  errorMsg?: string;
}

interface CommonProps {
  category: UploadCategory;
  onError: (message: string) => void;
  disabled?: boolean;
  accept?: string;
  maxBytes?: number;
  label?: string;
}

interface SingleProps extends CommonProps {
  mode: "single";
  initialPreviewUrl?: string;
  onUploaded: (key: string | null) => void;
  hasError?: boolean;
}

interface MultiProps extends CommonProps {
  mode: "multi";
  initialKeys?: string[];
  onKeysChange: (keys: string[]) => void;
  maxFiles?: number;
}

export type ImageUploaderProps = SingleProps | MultiProps;

const DEFAULT_ACCEPT = "image/jpeg,image/png,image/webp";
const DEFAULT_MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function previewUrlFromKey(key: string): string {
  if (key.startsWith("/") || /^https?:\/\//i.test(key) || key.startsWith("blob:")) return key;
  return `/api/images/${key}`;
}

export function ImageUploader(props: ImageUploaderProps) {
  const {
    category,
    onError,
    disabled,
    accept = DEFAULT_ACCEPT,
    maxBytes = DEFAULT_MAX_BYTES,
    label,
  } = props;
  const isSingle = props.mode === "single";
  const maxFiles = isSingle ? 1 : ((props as MultiProps).maxFiles ?? 5);

  const inputRef = useRef<HTMLInputElement>(null);
  const [slots, setSlots] = useState<SlotState[]>(() => {
    if (isSingle) {
      const url = (props as SingleProps).initialPreviewUrl;
      return url ? [{ id: "initial", status: "done", previewUrl: url }] : [];
    }
    const keys = (props as MultiProps).initialKeys ?? [];
    return keys.map((k) => ({ id: k, status: "done", key: k, previewUrl: previewUrlFromKey(k) }));
  });
  const [dragging, setDragging] = useState(false);

  // Sync slots from initialKeys (multi mode) only when content actually changes.
  // Prevents an infinite loop when parent spreads form state on every render.
  const initialKeysSig = useMemo(() => {
    if (isSingle) return "";
    return ((props as MultiProps).initialKeys ?? []).join("|");
  }, [isSingle, props]);
  const lastInitialKeysSig = useRef<string>(initialKeysSig);
  useEffect(() => {
    if (isSingle) return;
    if (initialKeysSig === lastInitialKeysSig.current) return;
    lastInitialKeysSig.current = initialKeysSig;

    const keys = (props as MultiProps).initialKeys ?? [];
    if (keys.length === 0) {
      setSlots([]);
    } else if (slots.length === 0) {
      setSlots(
        keys.map((k) => ({ id: k, status: "done", key: k, previewUrl: previewUrlFromKey(k) }))
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialKeysSig]);

  // Multi mode: propagate done keys whenever they change. Safe because new uploads
  // append a slot rather than replacing — done keys monotonically grow during upload.
  useEffect(() => {
    if (isSingle) return;
    const doneKeys = slots.filter((s) => s.status === "done" && s.key).map((s) => s.key!);
    (props as MultiProps).onKeysChange(doneKeys);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots, isSingle]);

  // Revoke blob URLs on unmount.
  useEffect(
    () => () => {
      slots.forEach((s) => {
        if (s.previewUrl.startsWith("blob:")) URL.revokeObjectURL(s.previewUrl);
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  async function handleUpload(file: File) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      onError("Formato no permitido. Usa JPG, PNG o WebP.");
      return;
    }
    if (file.size > maxBytes) {
      onError(`La imagen "${file.name}" excede el tamaño máximo (10 MB).`);
      return;
    }

    const slotId = crypto.randomUUID();
    const previewUrl = URL.createObjectURL(file);

    if (isSingle) {
      // Replace whatever is there — delete the old uploaded object if any.
      setSlots((prev) => {
        prev.forEach((s) => {
          if (s.previewUrl.startsWith("blob:")) URL.revokeObjectURL(s.previewUrl);
          if (s.status === "done" && s.key) {
            void deleteFile(s.key).catch(() => {});
          }
        });
        return [{ id: slotId, status: "uploading", previewUrl }];
      });
    } else {
      setSlots((prev) => [...prev, { id: slotId, status: "uploading", previewUrl }]);
    }

    try {
      const key = await uploadFile(file, category);
      setSlots((prev) => prev.map((s) => (s.id === slotId ? { ...s, status: "done", key } : s)));
      if (isSingle) (props as SingleProps).onUploaded(key);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al subir la imagen";
      onError(`Fallo al subir "${file.name}": ${msg}`);
      setSlots((prev) =>
        prev.map((s) => (s.id === slotId ? { ...s, status: "error", errorMsg: msg } : s))
      );
      if (isSingle) (props as SingleProps).onUploaded(null);
    }
  }

  function enqueueFiles(files: File[]) {
    if (files.length === 0) return;
    const activeCount = slots.filter((s) => s.status !== "error").length;
    const spacesLeft = maxFiles - activeCount;
    const toUpload = files.slice(0, Math.max(spacesLeft, isSingle ? 1 : 0));
    if (!isSingle && files.length > spacesLeft) {
      onError(`Límite máximo de ${maxFiles} imágenes alcanzado.`);
    }
    toUpload.forEach((f) => handleUpload(f));
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    enqueueFiles(Array.from(e.target.files ?? []));
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    enqueueFiles(Array.from(e.dataTransfer.files));
  }

  async function handleRemove(slotId: string) {
    const slot = slots.find((s) => s.id === slotId);
    if (!slot) return;
    if (slot.status === "done" && slot.key) {
      deleteFile(slot.key).catch(() => {});
    }
    if (slot.previewUrl.startsWith("blob:")) URL.revokeObjectURL(slot.previewUrl);
    setSlots((prev) => prev.filter((s) => s.id !== slotId));
    if (isSingle) (props as SingleProps).onUploaded(null);
  }

  const activeSlotsCount = slots.filter((s) => s.status !== "error").length;
  const canAddMore = activeSlotsCount < maxFiles;

  const singleHasError = isSingle && (props as SingleProps).hasError;
  const dropzoneBorder = singleHasError
    ? "border-[#e42200] bg-[#fff5f5]"
    : dragging
      ? "border-[#8b434a] bg-[#fff8f9]"
      : "border-gray-300 hover:border-[#8b434a] bg-gray-50";

  return (
    <div className="space-y-3">
      {label && <label className="block text-[14px] font-medium text-[#1e1e1e]">{label}</label>}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {slots.map((slot) => (
          <div
            key={slot.id}
            className={`relative aspect-square border rounded-lg overflow-hidden flex flex-col items-center justify-center bg-gray-50 group ${
              slot.status === "error" ? "border-red-300" : "border-gray-200"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slot.previewUrl}
              alt="Preview"
              className={`w-full h-full object-cover ${slot.status === "uploading" ? "opacity-50" : ""}`}
            />

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

            {slot.status === "error" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50/90 p-2 text-center">
                <Warning size={20} className="text-red-500 mb-1" />
                <span className="text-[10px] text-red-700 leading-tight line-clamp-2">
                  {slot.errorMsg || "Error"}
                </span>
              </div>
            )}

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
            className={`aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer p-4 transition-colors select-none ${dropzoneBorder}`}
          >
            <CloudArrowUp
              size={32}
              weight="thin"
              className={dragging ? "text-[#8b434a]" : "text-gray-400"}
            />
            <span className="text-[12px] font-semibold text-gray-700 mt-2 text-center leading-tight">
              {isSingle && slots.length > 0 ? "Reemplazar imagen" : "Añadir imagen"}
            </span>
            <span className="text-[10px] text-gray-400 mt-1 text-center">
              JPG, PNG, WebP · Max 10MB
              {!isSingle && ` (${activeSlotsCount}/${maxFiles})`}
            </span>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple={!isSingle}
        accept={accept}
        onChange={handleFileSelect}
        disabled={disabled}
        className="hidden"
      />
    </div>
  );
}
