// Object-key construction helpers. Keys are the path inside the bucket.
// Never embed user-supplied filenames verbatim — generate UUIDs and store
// the original filename in Postgres alongside the key.
import { randomUUID } from "node:crypto";

export const STORAGE_CATEGORIES = [
  "materiales",
  "servicios",
  "disenios",
  "notas",
  "cotizaciones",
] as const;

export type StorageCategory = (typeof STORAGE_CATEGORIES)[number];

const EXT_RE = /^[a-z0-9]{1,8}$/i;

// Returns a sanitized lowercase extension without the leading dot,
// or null if the input is missing or unsafe. Note: application/postscript
// is ambiguous (.ai vs .eps); callers handling design files should fall
// back to extFromFilename when this returns "ps".
export function extFromMime(mime: string): string | null {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/svg+xml": "svg",
    "application/pdf": "pdf",
    "application/postscript": "ps",
  };
  return map[mime.toLowerCase()] ?? null;
}

export function extFromFilename(name: string): string | null {
  const dot = name.lastIndexOf(".");
  if (dot < 0) return null;
  const ext = name.slice(dot + 1).toLowerCase();
  return EXT_RE.test(ext) ? ext : null;
}

// Build a key like `materiales/2026/05/<uuid>.jpg`.
// The yyyy/mm prefix keeps listings reasonable and lets us scope lifecycle rules.
export function buildKey(category: StorageCategory, ext: string): string {
  if (!EXT_RE.test(ext)) throw new Error(`invalid extension: ${ext}`);
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${category}/${yyyy}/${mm}/${randomUUID()}.${ext.toLowerCase()}`;
}

const KEY_RE =
  /^([a-z]+)\/\d{4}\/\d{2}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[a-z0-9]{1,8}$/;

// True iff `key` matches the shape produced by buildKey.
// Optional `category` narrows the check to a specific top-level prefix.
export function isValidKey(key: string, category?: StorageCategory): boolean {
  const m = KEY_RE.exec(key);
  if (!m) return false;
  if (category && m[1] !== category) return false;
  return true;
}
