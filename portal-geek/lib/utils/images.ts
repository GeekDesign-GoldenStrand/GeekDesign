/**
 * Parses a service's `imagen_url` field (which can be a legacy single string or a JSON array of keys)
 * and resolves each key to a displayable URL (either a direct public/local URL or a proxied GCS/S3 image route).
 */
export function getServiceImageUrls(imagenUrl: string | null | undefined): string[] {
  if (!imagenUrl || imagenUrl.trim() === "") return [];

  let keys: string[] = [];
  try {
    const trimmed = imagenUrl.trim();
    if (trimmed.startsWith("[")) {
      keys = JSON.parse(trimmed);
      if (!Array.isArray(keys)) {
        keys = [trimmed];
      }
    } else {
      keys = [trimmed];
    }
  } catch {
    keys = [imagenUrl];
  }

  return keys
    .map((key) => {
      if (!key) return "";
      const cleanKey = key.trim();
      // If it's an absolute URL or a local public path (starts with /), return as-is
      if (/^https?:\/\//i.test(cleanKey) || cleanKey.startsWith("/")) {
        return cleanKey;
      }
      // Otherwise, resolve through our same-origin secure image proxy
      return `/api/images/${cleanKey}`;
    })
    .filter(Boolean);
}
