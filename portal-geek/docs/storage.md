# Object Storage Setup

> **⚠️ Historical planning doc.** The storage layer described here as "to do"
> is now **implemented**. For how the system actually works, see
> [`storage-architecture.md`](./storage-architecture.md). This file is kept for
> its provider-comparison and GCS bucket-setup sections (still accurate), but
> the "currently has only environment-variable scaffolding" claim below is
> obsolete.

This document describes how to wire object storage (file uploads / asset hosting) into the portal. The codebase currently has only environment-variable scaffolding — no SDK, no client, no service code.

## Background

The original spec uses **Oracle Object Storage** (see `.env.example`: `ORACLE_BUCKET_NAME`, `ORACLE_NAMESPACE`, `ORACLE_REGION`, `ORACLE_ACCESS_KEY`, `ORACLE_SECRET_KEY`).

Until the client funds the Oracle account, we will use **Google Cloud Storage (GCS)** in S3-compatible mode, driven by the **AWS SDK for JavaScript v3**. This way the same client code works for:

- GCS today (via the GCS XML / interoperability API)
- AWS S3 later (real S3, no code change beyond env)
- Oracle Object Storage later (also S3-compatible, no code change beyond env)

The only thing that changes between providers is the `endpoint` URL and the credentials.

---

## Provider compatibility — what works, what doesn't

GCS exposes an S3-compatible **XML API**. The AWS SDK can talk to it natively when you point `endpoint` at `https://storage.googleapis.com` and authenticate with **HMAC keys** (not service account JSON).

### Works out of the box

- `PutObject`, `GetObject`, `DeleteObject`, `HeadObject`
- `ListObjectsV2`
- **Presigned URLs** (V4 signing) — both PUT (uploads) and GET (downloads)
- Standard request headers: `Content-Type`, `Content-Length`, `Cache-Control`, custom `x-amz-meta-*`

### Caveats / differences

- **Multipart uploads:** S3 multipart works in a limited form on GCS but is not 1:1. For files > ~50 MB prefer GCS resumable uploads, or stream through the server in smaller chunks. For typical product images this is not a concern.
- **Bucket policies / ACLs / tagging / object lock / SSE-KMS / batch ops:** S3-specific, do not map to GCS. Stick to basic object verbs.
- **CORS:** configured on the GCS bucket itself via `gsutil cors set` or the GCS console. Not via the S3 API.
- **Auth:** HMAC key + secret only. No STS, no IAM-role assumption, no S3-style presigned POST policies.
- **Path style:** GCS prefers virtual-hosted-style URLs; do **not** set `forcePathStyle: true`.

For the portal's needs (product / material images, user-uploaded assets, generated invoices/receipts), all of this is fine.

---

## What needs to be done

### 1. Pick the file layout

```
portal-geek/
├── lib/
│   ├── services/
│   │   └── storage.ts          # high-level service: upload, getUrl, delete, presignPut
│   └── storage/
│       ├── client.ts           # S3Client singleton, env-driven
│       └── keys.ts             # key/path helpers (e.g. `products/{id}/{uuid}.{ext}`)
└── app/
    └── api/
        └── uploads/
            └── route.ts        # POST → returns presigned PUT url
```

The split between `lib/storage/` (low-level client) and `lib/services/storage.ts` (business-level operations) matches the existing pattern in `lib/services/` and `lib/db/`.

### 2. Install dependencies

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

Both packages are tree-shakeable and add ~150 KB to the server bundle. Neither ships to the client — all storage code runs server-side only.

### 3. Add env vars

Replace the `Oracle Object Storage` block in `.env.example` with a provider-agnostic block. The variable names stay generic (`STORAGE_*`) so the same code works against GCS, S3, or Oracle.

```dotenv
# ── Object Storage (S3-compatible: GCS / AWS S3 / Oracle) ─────────────────────
# Endpoint:
#   GCS:    https://storage.googleapis.com
#   AWS S3: leave empty (SDK uses default)
#   Oracle: https://<namespace>.compat.objectstorage.<region>.oraclecloud.com
STORAGE_ENDPOINT=""
STORAGE_REGION="auto"
STORAGE_BUCKET=""
STORAGE_ACCESS_KEY=""
STORAGE_SECRET_KEY=""

# Public base URL for direct GET (optional — lets you skip presigning reads).
#   GCS:    https://storage.googleapis.com/<bucket>
#   AWS S3: https://<bucket>.s3.<region>.amazonaws.com
# Leave empty to always serve via presigned GET URLs.
STORAGE_PUBLIC_BASE_URL=""
```

Add a Zod schema in `lib/schemas/` (or wherever env validation lives) so missing values fail at boot, not at first upload.

### 4. Create the GCS bucket and HMAC credentials

In the GCP console (or with `gcloud`):

1. **Create the bucket**

   ```bash
   gcloud storage buckets create gs://geekdesign-portal-dev \
     --location=us-central1 \
     --uniform-bucket-level-access
   ```

   Use one bucket per environment (`-dev`, `-staging`, `-prod`).

2. **Create a service account dedicated to the portal**

   ```bash
   gcloud iam service-accounts create portal-storage \
     --display-name="Portal storage access"
   ```

3. **Grant it object-level access on the bucket only** (not project-wide)

   ```bash
   gcloud storage buckets add-iam-policy-binding gs://geekdesign-portal-dev \
     --member="serviceAccount:portal-storage@<project>.iam.gserviceaccount.com" \
     --role="roles/storage.objectAdmin"
   ```

4. **Generate HMAC keys** for that service account (Console → Cloud Storage → Settings → Interoperability → Create key for service account). Copy the access ID and secret into `STORAGE_ACCESS_KEY` / `STORAGE_SECRET_KEY`. Treat them like AWS keys — never commit, never log.

5. **Configure CORS** so the browser can upload directly via presigned PUT:

   ```json
   [
     {
       "origin": ["http://localhost:3000", "https://portal.geekdesign.mx"],
       "method": ["GET", "PUT"],
       "responseHeader": ["Content-Type"],
       "maxAgeSeconds": 3600
     }
   ]
   ```

   ```bash
   gcloud storage buckets update gs://geekdesign-portal-dev --cors-file=cors.json
   ```

6. **Decide read access:**
   - **Private (recommended):** keep the bucket non-public, serve every read through a presigned GET URL with a short TTL (e.g. 5 min). Best for invoices, receipts, anything user-scoped.
   - **Public-read:** fine for product images, marketing assets. Make individual objects public-read on upload, or grant `roles/storage.objectViewer` to `allUsers`.

### 5. Implement the client

`lib/storage/client.ts`:

```ts
import { S3Client } from "@aws-sdk/client-s3";

export const storage = new S3Client({
  endpoint: process.env.STORAGE_ENDPOINT || undefined,
  region: process.env.STORAGE_REGION ?? "auto",
  credentials: {
    accessKeyId: process.env.STORAGE_ACCESS_KEY!,
    secretAccessKey: process.env.STORAGE_SECRET_KEY!,
  },
  forcePathStyle: false,
});

export const BUCKET = process.env.STORAGE_BUCKET!;
```

### 6. Implement the service layer

`lib/services/storage.ts` should expose a small, business-level API. Suggested surface:

```ts
uploadBuffer(key: string, body: Buffer, contentType: string): Promise<void>
deleteObject(key: string): Promise<void>
presignPut(key: string, contentType: string, ttlSeconds?: number): Promise<string>
presignGet(key: string, ttlSeconds?: number): Promise<string>
publicUrl(key: string): string  // only if STORAGE_PUBLIC_BASE_URL is set
```

Keep key construction in `lib/storage/keys.ts` so callers never hand-craft paths:

```ts
productImageKey(productId: string, ext: string): string
userAvatarKey(userId: string): string
invoiceKey(orderId: string): string
```

### 7. Wire an upload route

For browser-driven uploads, the safe pattern is **presigned PUT**:

1. Client asks the server: "I want to upload `image/png`, 480 KB, for product X."
2. Server validates (auth, size cap, mime allow-list, ownership) and returns a one-shot presigned PUT URL + the final object key.
3. Client `PUT`s the file directly to GCS — the server is never in the byte path.
4. Client tells the server "done, key = …", server records the key in Postgres.

This avoids streaming uploads through Next.js and works under serverless body-size limits.

### 8. Tests

Add Jest tests under `__tests__/` covering:

- Key helpers produce the expected shape.
- The service rejects disallowed mime types and oversized files.
- Presign returns a URL containing the bucket and key.

Hitting GCS in CI is not necessary; mock the `S3Client.send` call.

---

## Switching providers later

When the client funds Oracle (or AWS), no application code changes. Only env:

| Var                       | GCS                                       | AWS S3                                       | Oracle                                                               |
| ------------------------- | ----------------------------------------- | -------------------------------------------- | -------------------------------------------------------------------- |
| `STORAGE_ENDPOINT`        | `https://storage.googleapis.com`          | _(empty)_                                    | `https://<ns>.compat.objectstorage.<region>.oraclecloud.com`         |
| `STORAGE_REGION`          | `auto`                                    | e.g. `us-east-1`                             | e.g. `mx-queretaro-1`                                                |
| `STORAGE_ACCESS_KEY`      | HMAC access ID                            | IAM access key                               | Customer secret key ID                                               |
| `STORAGE_SECRET_KEY`      | HMAC secret                               | IAM secret                                   | Customer secret key                                                  |
| `STORAGE_PUBLIC_BASE_URL` | `https://storage.googleapis.com/<bucket>` | `https://<bucket>.s3.<region>.amazonaws.com` | `https://objectstorage.<region>.oraclecloud.com/n/<ns>/b/<bucket>/o` |

Migrating existing objects is a separate one-shot job (`gsutil rsync` to S3, or `oci os object bulk-upload`) — out of scope for the application change.

---

## Security checklist

- [ ] HMAC credentials live only in `.env.local` and the deploy platform's secret store. Never commit, never log.
- [ ] Service account is bucket-scoped, not project-scoped.
- [ ] Server validates mime type and size **before** issuing a presigned PUT.
- [ ] Presigned URLs use a short TTL (≤ 15 min).
- [ ] Object keys do not embed user-supplied filenames verbatim — generate UUIDs and store the original filename in Postgres.
- [ ] CORS allow-list contains only the portal's origins.
- [ ] Per-environment buckets (dev / staging / prod), each with its own credentials.

---

## Open questions for the team

1. Public-read product images, or always presigned GET? (Affects CDN strategy and cache headers.)
2. Max upload size and allowed mime types per asset category.
3. Retention policy for invoices and other regulated documents.
4. Do we need image transforms (resize, webp conversion) on upload? If yes, decide between an inline server step, a Cloud Function trigger on the bucket, or a CDN-level image service.
