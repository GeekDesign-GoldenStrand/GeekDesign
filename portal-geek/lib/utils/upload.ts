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
