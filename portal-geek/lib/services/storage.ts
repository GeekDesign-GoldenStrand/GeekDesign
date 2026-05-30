import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { getBucket, getPublicBaseUrl, getStorage } from "@/lib/storage/client";
import { ValidationError } from "@/lib/utils/errors";

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
// `contentType` and `contentLength` are both bound into the signature — the
// client must send matching headers. ContentLength is the T4 hardening: the
// declared body.size becomes a hard byte cap GCS enforces, so a client can't
// presign a 10MB upload and then PUT 200MB.
export async function presignPut(
  key: string,
  contentType: string,
  contentLength: number,
  ttlSeconds?: number
): Promise<string> {
  return getSignedUrl(
    getStorage(),
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      ContentType: contentType,
      ContentLength: contentLength,
    }),
    { expiresIn: clampTtl(ttlSeconds) }
  );
}

// Short-lived read URL. Use this for any user-scoped or sensitive object.
// Pass `filename` to force a Content-Disposition: attachment header so the
// browser downloads the file with the original name instead of the UUID key.
// Especially important for opaque MIME types like application/postscript (.ai/.eps)
// and application/octet-stream (.dxf) that browsers can't display inline.
//
// T3 hardening: design files (disenios/) ALWAYS download as attachments, even
// if the caller forgets to pass a filename. Otherwise an SVG with embedded
// <script> would render inline in browser context against the GCS origin when
// an admin opens "view in new tab". The SRS allows SVG uploads (line 547);
// belt-and-suspenders is the only safe response.
export async function presignGet(
  key: string,
  ttlSeconds?: number,
  filename?: string
): Promise<string> {
  const forceAttachment = key.startsWith("disenios/");
  const disposition = filename
    ? // RFC 6266 / RFC 5987: `filename=` only supports US-ASCII and browsers
      // treat percent-encoded sequences literally (i.e. the file would download
      // as "logo%20client.ai" instead of "logo client.ai").
      // The `filename*=UTF-8''` extended parameter carries the full Unicode name;
      // the ASCII `filename=` fallback is for older clients that don't support it.
      [
        "attachment",
        `filename="${filename.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_")}"`,
        `filename*=UTF-8''${encodeURIComponent(filename)}`,
      ].join("; ")
    : forceAttachment
      ? "attachment"
      : undefined;

  return getSignedUrl(
    getStorage(),
    new GetObjectCommand({
      Bucket: getBucket(),
      Key: key,
      ...(disposition ? { ResponseContentDisposition: disposition } : {}),
    }),
    { expiresIn: clampTtl(ttlSeconds) }
  );
}

// Returns a stable public URL when STORAGE_PUBLIC_BASE_URL is configured
// (i.e. the bucket / object is public-read). Returns null otherwise.
export function publicUrl(key: string): string | null {
  const base = getPublicBaseUrl();
  return base ? `${base}/${key}` : null;
}

// ─── T6: server-side magic-byte sniff ───────────────────────────────────────
// Browser → GCS uploads are signed against the client-declared Content-Type
// but GCS doesn't verify body bytes match. A client that signs `image/png`
// can PUT SVG bytes and GCS stores them with Content-Type: image/png. The
// only sound fix is to re-check the first bytes server-side BEFORE the
// persisted entity (Materiales/Servicios) is allowed to reference the key.

// Magic-byte signatures for raster image formats accepted by materiales/servicios.
// Reads the first 16 bytes (enough for WebP's RIFF…WEBP at offset 0/8).
const isJpeg = (b: Buffer) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
const isPng = (b: Buffer) =>
  b[0] === 0x89 &&
  b[1] === 0x50 &&
  b[2] === 0x4e &&
  b[3] === 0x47 &&
  b[4] === 0x0d &&
  b[5] === 0x0a &&
  b[6] === 0x1a &&
  b[7] === 0x0a;
const isWebp = (b: Buffer) =>
  b[0] === 0x52 &&
  b[1] === 0x49 &&
  b[2] === 0x46 &&
  b[3] === 0x46 &&
  b[8] === 0x57 &&
  b[9] === 0x45 &&
  b[10] === 0x42 &&
  b[11] === 0x50;

async function readObjectHeader(key: string, bytes = 15): Promise<Buffer> {
  const res = await getStorage().send(
    new GetObjectCommand({
      Bucket: getBucket(),
      Key: key,
      Range: `bytes=0-${bytes}`,
    })
  );
  const chunks: Buffer[] = [];
  const stream = res.Body as AsyncIterable<Uint8Array>;
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

// Throws ValidationError + deletes the offending object if the bytes don't
// match a known raster image signature. Call from the create/update path of
// any entity that references a user-uploaded image key (Materiales.imagen_url,
// Servicios.imagen_url JSON array). Skip silently for legacy absolute URLs
// (rows created before keys were introduced) and for the empty/null sentinel.
export async function assertObjectIsImage(key: string | null | undefined): Promise<void> {
  if (!key) return;
  if (/^https?:\/\//i.test(key)) return; // legacy row

  let header: Buffer;
  try {
    header = await readObjectHeader(key);
  } catch {
    throw new ValidationError("El archivo subido no se pudo verificar. Vuelve a intentarlo.");
  }

  if (header.length < 12) {
    // Truncated upload — too small to be any real raster image.
    await deleteObject(key).catch(() => {});
    throw new ValidationError("El archivo subido no es una imagen válida.");
  }

  const matches = isJpeg(header) || isPng(header) || isWebp(header);
  if (!matches) {
    // Best-effort cleanup so the bucket doesn't accumulate bogus uploads.
    await deleteObject(key).catch(() => {});
    throw new ValidationError("El archivo subido no es una imagen válida (JPG, PNG o WebP).");
  }
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
