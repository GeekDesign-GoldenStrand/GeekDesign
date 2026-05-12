import type { STORAGE_CATEGORIES } from "@/lib/storage/keys";

type Category = (typeof STORAGE_CATEGORIES)[number];

type PresignResponse = {
  data?: { key: string; url: string; expiresIn: number };
  error?: string;
};

// Uploads a single file via presigned PUT. Returns the storage key the server
// minted — that's what gets persisted on the owning entity (e.g. Materiales.imagen_url).
export async function uploadFile(file: File, category: Category): Promise<string> {
  const presignRes = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      category,
      contentType: file.type,
      size: file.size,
      filename: file.name,
    }),
  });

  const presignBody: PresignResponse = await presignRes.json().catch(() => ({}));
  if (!presignRes.ok || !presignBody.data) {
    throw new Error(presignBody.error ?? `Error ${presignRes.status} al solicitar la subida`);
  }

  const { key, url } = presignBody.data;

  // The server signs against this exact Content-Type; mismatch → 403 from GCS.
  const putRes = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  if (!putRes.ok) {
    throw new Error(`Error ${putRes.status} al subir el archivo`);
  }

  return key;
}

// Removes an orphan upload from the bucket — used when the user clears a
// freshly-uploaded but not-yet-saved file. The server refuses to delete keys
// already referenced by a persisted entity, so this is safe to call from the UI.
export async function deleteFile(key: string): Promise<void> {
  const res = await fetch(`/api/upload?key=${encodeURIComponent(key)}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `Error ${res.status} al eliminar el archivo`);
  }
}
