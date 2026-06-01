import { presignGet, publicUrl } from "@/lib/services/storage";

/**
 * Parses a service's `imagen_url` field (which can be a legacy single string
 * or a JSON array of keys) and returns proxy URLs that 302 to a fresh
 * presigned GCS read.
 *
 * Use this in client components and any path where the URL is consumed
 * outside the storefront LCP-critical render. For the storefront pages
 * themselves, prefer `getServiceImageUrlsResolved` — it embeds the
 * presigned URL directly so the browser skips the proxy hop entirely.
 */
export function getServiceImageUrls(imagenUrl: string | null | undefined): string[] {
  return parseKeys(imagenUrl)
    .map((key) => {
      if (/^https?:\/\//i.test(key) || key.startsWith("/")) return key;
      return `/api/images/${key}`;
    })
    .filter(Boolean);
}

/**
 * Server-only counterpart of `getServiceImageUrls`: resolves each key to a
 * direct GCS URL (public if STORAGE_PUBLIC_BASE_URL is set, otherwise a
 * presigned GET valid for 15 min). Use in storefront Server Components so
 * the rendered HTML embeds the GCS URL directly — the browser hits Google's
 * edge in one round-trip instead of bouncing through /api/images for a 302.
 *
 * Safety w.r.t. HTML caching: the storefront pages use ISR with revalidate
 * = 60 s. A 15-min signature TTL gives 14 min of headroom on every
 * revalidation window, so signatures never go stale before the HTML does.
 *
 * Falls back to the proxy path if presigning throws (e.g. local dev without
 * STORAGE_* env vars set) so /tienda still renders.
 */
export async function getServiceImageUrlsResolved(
  imagenUrl: string | null | undefined
): Promise<string[]> {
  const keys = parseKeys(imagenUrl);
  const resolved = await Promise.all(
    keys.map(async (key) => {
      if (/^https?:\/\//i.test(key) || key.startsWith("/")) return key;
      try {
        // 15 min TTL — the cap enforced by clampTtl in lib/services/storage.ts.
        // ISR revalidate = 60 s, so HTML always regenerates with fresh
        // signatures long before the 15-min window closes.
        return publicUrl(key) ?? (await presignGet(key, 15 * 60));
      } catch {
        return `/api/images/${key}`;
      }
    })
  );
  return resolved.filter(Boolean);
}

// Shared parser. `imagen_url` can be:
//   - null / undefined / empty                      -> []
//   - a single key or absolute URL string           -> [trimmed]
//   - a JSON array string like `["k1","k2"]`        -> trimmed entries
// Anything that looks like a JSON array but doesn't parse falls back to
// treating the whole string as one key (preserves legacy data).
function parseKeys(imagenUrl: string | null | undefined): string[] {
  if (!imagenUrl || imagenUrl.trim() === "") return [];

  const trimmed = imagenUrl.trim();
  let keys: string[];
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      keys = Array.isArray(parsed) ? parsed : [trimmed];
    } catch {
      keys = [imagenUrl];
    }
  } else {
    keys = [trimmed];
  }
  return keys.map((k) => (typeof k === "string" ? k.trim() : "")).filter(Boolean);
}
