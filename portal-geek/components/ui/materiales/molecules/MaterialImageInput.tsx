"use client";

import { useEffect, useRef, useState } from "react";

import { deleteFile, uploadFile } from "@/lib/utils/upload";

interface MaterialImageInputProps {
  // Presigned GET URL for an already-saved image, when editing. Null/empty when registering.
  initialPreviewUrl?: string;
  // Called with the new storage key once the upload completes, or null if the
  // user clears their selection (revert to the original image).
  onUploaded: (key: string | null) => void;
  // Called with a human-friendly message on upload failure.
  onError: (message: string) => void;
  disabled?: boolean;
  hasError?: boolean;
}

const ACCEPT = "image/jpeg,image/png,image/webp";
const MAX_BYTES = 10 * 1024 * 1024;

const FIELD_BASE =
  "w-full border rounded-[6px] px-3 py-2 text-[14px] outline-none transition-colors cursor-pointer";

export function MaterialImageInput({
  initialPreviewUrl,
  onUploaded,
  onError,
  disabled,
  hasError,
}: MaterialImageInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedKey, setUploadedKey] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  // Revoke object URLs on unmount / replacement to avoid leaks.
  useEffect(
    () => () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    },
    [localPreview]
  );

  const previewSrc = localPreview ?? initialPreviewUrl ?? "";

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      onError("Formato no permitido. Usa JPG, PNG o WebP.");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_BYTES) {
      onError("La imagen excede el tamaño máximo (10 MB).");
      event.target.value = "";
      return;
    }

    if (localPreview) URL.revokeObjectURL(localPreview);
    // If we already uploaded a previous file in this session, clean it up before
    // replacing. Fire-and-forget: a failure becomes an orphan for nightly GC.
    if (uploadedKey) {
      void deleteFile(uploadedKey).catch(() => {});
    }
    const blobUrl = URL.createObjectURL(file);
    setLocalPreview(blobUrl);
    setFileName(file.name);
    setUploading(true);

    try {
      const key = await uploadFile(file, "materiales");
      setUploadedKey(key);
      onUploaded(key);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Error al subir la imagen.");
      setUploadedKey(null);
      onUploaded(null);
    } finally {
      setUploading(false);
    }
  }

  function handleClear() {
    if (localPreview) URL.revokeObjectURL(localPreview);
    // Server refuses to delete keys already referenced by a saved entity, so
    // this only removes the bucket object if it was never committed.
    if (uploadedKey) {
      void deleteFile(uploadedKey).catch(() => {});
    }
    setLocalPreview(null);
    setUploadedKey(null);
    setFileName(null);
    onUploaded(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  const borderColor = hasError
    ? "border-[#e42200]"
    : uploadedKey
      ? "border-[#00c853]"
      : "border-[#b9b8b8]";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading}
          className={`${FIELD_BASE} ${borderColor} bg-white text-left text-[#1e1e1e] hover:bg-[#f5f5f5] disabled:opacity-60`}
        >
          {uploading
            ? "Subiendo..."
            : fileName
              ? fileName
              : initialPreviewUrl
                ? "Reemplazar imagen"
                : "Seleccionar imagen"}
        </button>
        {(localPreview || uploadedKey) && !uploading && (
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            className="text-[13px] text-[#575757] underline hover:text-[#1e1e1e] disabled:opacity-60"
          >
            Quitar
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        onChange={handleChange}
        disabled={disabled || uploading}
        className="hidden"
      />
      {previewSrc && (
        // Presigned/object URLs are not in next.config remotePatterns, so use <img>.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewSrc}
          alt="Vista previa"
          className="h-32 w-32 rounded-[6px] border border-[#e4e4e4] object-cover"
        />
      )}
    </div>
  );
}
