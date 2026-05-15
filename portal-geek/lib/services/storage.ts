import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { getBucket, getPublicBaseUrl, getStorage } from "@/lib/storage/client";

export const DEFAULT_TTL_SECONDS = 5 * 60;
const MAX_TTL_SECONDS = 15 * 60;

function clampTtl(ttl: number | undefined): number {
  const t = ttl ?? DEFAULT_TTL_SECONDS;
  if (t <= 0) return DEFAULT_TTL_SECONDS;
  return Math.min(t, MAX_TTL_SECONDS);
}

// Upload a buffer directly from server code (e.g. invoice PDFs generated server-side).
export async function uploadBuffer(key: string, body: Buffer, contentType: string): Promise<void> {
  await getStorage().send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
}

export async function deleteObject(key: string): Promise<void> {
  await getStorage().send(new DeleteObjectCommand({ Bucket: getBucket(), Key: key }));
}

export async function objectExists(key: string): Promise<boolean> {
  try {
    await getStorage().send(new HeadObjectCommand({ Bucket: getBucket(), Key: key }));
    return true;
  } catch (err) {
    const status = (err as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
    if (status === 404) return false;
    throw err;
  }
}

// One-shot upload URL the browser PUTs to directly.
// `contentType` is bound into the signature — the client must send the same header.
export async function presignPut(
  key: string,
  contentType: string,
  ttlSeconds?: number
): Promise<string> {
  return getSignedUrl(
    getStorage(),
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn: clampTtl(ttlSeconds) }
  );
}

// Short-lived read URL. Use this for any user-scoped or sensitive object.
export async function presignGet(key: string, ttlSeconds?: number): Promise<string> {
  return getSignedUrl(getStorage(), new GetObjectCommand({ Bucket: getBucket(), Key: key }), {
    expiresIn: clampTtl(ttlSeconds),
  });
}

// Returns a stable public URL when STORAGE_PUBLIC_BASE_URL is configured
// (i.e. the bucket / object is public-read). Returns null otherwise.
export function publicUrl(key: string): string | null {
  const base = getPublicBaseUrl();
  return base ? `${base}/${key}` : null;
}

// URL the public storefront should embed for an object stored in a
// catalog-public category (materiales, servicios). Same-origin proxy that
// 302s to a fresh presigned URL — stable for HTML caching even though the
// bucket stays private.
export function publicImageUrl(key: string): string {
  return `/api/images/${key}`;
}

// Resolves a stored object key to something the browser can fetch:
// the public URL when STORAGE_PUBLIC_BASE_URL is configured, otherwise a
// short-lived presigned GET (default 5 min).
//
// Use on admin / auth-gated read paths where the URL is consumed
// immediately. For the public storefront use `publicImageUrl(key)` instead
// — it returns the stable `/api/images/<key>` proxy route, which 302s to a
// fresh presigned URL per request and so survives HTML caching.
export async function resolveImageUrl(key: string | null): Promise<string | null> {
  if (!key) return null;
  // Legacy rows may still hold absolute URLs from before keys were introduced.
  if (/^https?:\/\//i.test(key)) return key;
  return publicUrl(key) ?? presignGet(key);
}
