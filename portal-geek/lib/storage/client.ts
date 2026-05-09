// S3-compatible storage client singleton.
// Works against GCS (interoperability/HMAC), AWS S3, and Oracle Object Storage.
// Provider is selected entirely by env: code is provider-agnostic.
import { S3Client } from "@aws-sdk/client-s3";

// Lazy-init: don't read env at module load. This keeps importing the storage
// service safe in environments without storage credentials (e.g. unit tests
// that mock the service entirely).
function createStorageClient(): S3Client {
  const endpoint = process.env.STORAGE_ENDPOINT?.trim() || undefined;
  const region = process.env.STORAGE_REGION?.trim() || "auto";
  const accessKeyId = process.env.STORAGE_ACCESS_KEY;
  const secretAccessKey = process.env.STORAGE_SECRET_KEY;

  if (!accessKeyId || !secretAccessKey) {
    throw new Error("STORAGE_ACCESS_KEY and STORAGE_SECRET_KEY must be set");
  }

  return new S3Client({
    endpoint,
    region,
    credentials: { accessKeyId, secretAccessKey },
    // GCS and AWS both prefer virtual-hosted-style. Oracle works either way.
    forcePathStyle: false,
  });
}

const globalForStorage = globalThis as unknown as { storage?: S3Client };

export function getStorage(): S3Client {
  if (!globalForStorage.storage) {
    globalForStorage.storage = createStorageClient();
  }
  return globalForStorage.storage;
}

export function getBucket(): string {
  const bucket = process.env.STORAGE_BUCKET;
  if (!bucket) throw new Error("STORAGE_BUCKET must be set");
  return bucket;
}

export function getPublicBaseUrl(): string | null {
  const url = process.env.STORAGE_PUBLIC_BASE_URL?.trim();
  return url ? url.replace(/\/$/, "") : null;
}
