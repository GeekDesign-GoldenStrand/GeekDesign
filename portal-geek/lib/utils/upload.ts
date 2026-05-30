import type { STORAGE_CATEGORIES } from "@/lib/storage/keys";

type Category = (typeof STORAGE_CATEGORIES)[number];

type PresignResponse = {
  data?: {
    key: string;
    url: string;
    expiresIn: number;
    // Only returned by /api/upload/disenios (public endpoint). Auth'd uploads
    // gate DELETE via the session cookie instead.
    deleteToken?: string;
    deleteTokenExpiresIn?: number;
  };
  error?: string;
};

// Result of an upload. `deleteToken` is present only for the public disenios
// flow; pair it with the key when calling deleteDesignFile.
export interface UploadResult {
  key: string;
  deleteToken?: string;
}

// Uploads a single file via presigned PUT. Returns the storage key the server
// minted — that's what gets persisted on the owning entity (e.g. Materiales.imagen_url).
export async function uploadFile(
  file: File,
  category: Category,
  endpoint = "/api/upload"
): Promise<UploadResult> {
  const presignRes = await fetch(endpoint, {
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

  const { key, url, deleteToken } = presignBody.data;

  // The server signs against this exact Content-Type; mismatch → 403 from GCS.
  const putRes = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  if (!putRes.ok) {
    throw new Error(`Error ${putRes.status} al subir el archivo`);
  }

  return { key, deleteToken };
}

// Uploads a design file without requiring an authenticated session.
// Uses the public /api/upload/disenios endpoint (rate-limited by IP).
// The returned `deleteToken` MUST be retained until the file is either
// persisted (via cotización submit) or removed (via deleteDesignFile).
export async function uploadDesignFile(file: File): Promise<UploadResult> {
  return uploadFile(file, "disenios", "/api/upload/disenios");
}

// Removes an orphan upload from the bucket — used when the user clears a
// freshly-uploaded but not-yet-saved file. Requires an authenticated session.
// The server refuses to delete keys already referenced by a persisted entity,
// so this is safe to call from the UI.
export async function deleteFile(key: string): Promise<void> {
  const res = await fetch(`/api/upload?key=${encodeURIComponent(key)}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `Error ${res.status} al eliminar el archivo`);
  }
}

// Removes an orphan design upload — public counterpart of deleteFile() for use
// in the storefront where users are anonymous. Hits the unauthenticated
// DELETE /api/upload/disenios endpoint, which is scoped to the disenios/ prefix.
// The `deleteToken` must be the one returned by uploadDesignFile (T5).
export async function deleteDesignFile(key: string, deleteToken: string): Promise<void> {
  const params = new URLSearchParams({ key, token: deleteToken });
  const res = await fetch(`/api/upload/disenios?${params.toString()}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `Error ${res.status} al eliminar el archivo`);
  }
}
