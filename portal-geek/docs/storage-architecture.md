# Object Storage Architecture (as-built)

Owner: Enrique Ayala (`KIKW12` / `enayala`). This is the **as-built** doc for
the implemented storage layer. (`storage.md` is the original *planning* doc and
is now out of date — the code described below all exists.)

Related: [auth](./auth.md) (uploads sit behind `withAuth` + rate limit),
[routing topology](./routing-topology.md) (`/api/images` is the one public API
route).

## TL;DR

- **Provider-agnostic, S3-compatible.** AWS SDK v3 talks to **GCS** today
  (HMAC / interoperability), and the same code works for real AWS S3 or Oracle
  by changing only env vars.
- **Bucket stays private.** Browsers never get bucket credentials.
  - **Uploads:** server issues a one-shot **presigned PUT**; browser PUTs the
    bytes directly to GCS.
  - **Reads (admin):** short-lived **presigned GET**.
  - **Reads (public storefront):** stable same-origin proxy `/api/images/<key>`
    that 302-redirects to a fresh presigned GET per request.
- **Object keys are server-generated UUIDs** — never user filenames.

## Files

| File | Responsibility |
| --- | --- |
| `lib/storage/client.ts` | Lazy `S3Client` singleton, `getBucket()`, `getPublicBaseUrl()`. |
| `lib/storage/keys.ts` | Key construction/validation, mime↔ext mapping, categories. |
| `lib/services/storage.ts` | `uploadBuffer`, `deleteObject`, `objectExists`, `presignPut`, `presignGet`, `publicUrl`, `publicImageUrl`, `resolveImageUrl`. |
| `lib/schemas/upload.ts` | `PresignUploadSchema`, per-category `UPLOAD_LIMITS`. |
| `app/api/upload/route.ts` | `POST` → presigned PUT (auth + rate-limited + validated). |
| `app/api/images/[...key]/route.ts` | `GET` public proxy → 302 to presigned/public URL. |

## Environment

```dotenv
STORAGE_ENDPOINT="https://storage.googleapis.com"   # GCS; empty for real AWS S3
STORAGE_REGION="auto"                                # e.g. us-east-1 for AWS
STORAGE_BUCKET="geekdesign-portal-dev"
STORAGE_ACCESS_KEY="<HMAC access id>"
STORAGE_SECRET_KEY="<HMAC secret>"
STORAGE_PUBLIC_BASE_URL=""   # set only if bucket/objects are public-read
```

Client is **lazy-initialized** — env is read on first `getStorage()` call, not
at import. This keeps tests that mock the service from needing credentials.
Provider switching (GCS → S3 → Oracle) is **env-only, no code change**; see the
table in `storage.md` for per-provider values.

## Object keys (`lib/storage/keys.ts`)

Shape: `<category>/<yyyy>/<mm>/<uuid>.<ext>`, e.g.
`materiales/2026/05/3f2c…-….jpg`.

- **Categories:** `materiales`, `servicios`, `disenios`, `notas`,
  `cotizaciones`.
- `buildKey(category, ext)` generates the UUID + date prefix (lets us scope
  lifecycle rules and keeps listings shardable by month).
- `isValidKey(key, category?)` validates the exact shape via regex — used by
  the public proxy to reject anything that isn't a key we minted.
- ext resolution: `extFromMime` for image categories; `extFromFilename` for
  design files where `application/postscript` is ambiguous (.ai vs .eps) and
  `.dxf` has no reliable mime.

## Upload flow (presigned PUT)

```
POST /api/upload  { category, contentType, size, filename? }
  ├─ withAuth  (must be logged in)
  ├─ rate limit: 30 presigns / min per user id
  ├─ PresignUploadSchema.parse
  ├─ category === "cotizaciones"  → 403  (server-only writes)
  ├─ strip mime params, check UPLOAD_LIMITS[category].allowedMime
  ├─ check size <= maxBytes
  ├─ disenios: validate extension against allowedExt (filename-based)
  ├─ buildKey(category, ext)
  └─ return { url: presignPut(key, contentType), key }
Client then PUTs the file to `url` with the SAME Content-Type, and reports
`key` back to the server to persist in Postgres.
```

The server is **never in the byte path** — avoids Next.js/serverless body-size
limits. `contentType` is bound into the signature, so the browser must send the
identical header or GCS rejects the PUT.

### Per-category limits (`UPLOAD_LIMITS`)

| Category | Max | Allowed |
| --- | --- | --- |
| `materiales`, `servicios` | 10 MB | jpeg, png, webp |
| `disenios` | 25 MB | svg, ai, eps, dxf, pdf (ext-validated) |
| `notas` | 10 MB | jpeg, png, pdf |
| `cotizaciones` | 10 MB | pdf — **server-generated only**, browser PUT blocked |

## Read flows

- **`presignGet(key, ttl?)`** — short-lived GET URL (default 5 min, capped at
  15 min via `clampTtl`). Use for admin/auth-gated reads consumed immediately.
- **`resolveImageUrl(key)`** — returns `publicUrl` if `STORAGE_PUBLIC_BASE_URL`
  is set, else a presigned GET. Tolerates legacy absolute-URL rows from before
  keys existed.
- **`publicImageUrl(key)` → `/api/images/<key>`** — what the **storefront**
  embeds in `<img>`. Stable across HTML caching because the URL never changes;
  each hit resolves server-side to a fresh signature.

### The public proxy (`/api/images/[...key]`)

The **only** unauthenticated storage route. It:
1. Joins the catch-all segments into a key and runs `isValidKey` (422 if not).
2. Allows only `PUBLIC_CATEGORIES = { materiales, servicios }` (404 otherwise) —
   so `disenios` (client IP), `notas` (client-private), and `cotizaciones`
   (financial) are **never** exposed here.
3. 302-redirects to `publicUrl(key)` or a presigned GET, with
   `Cache-Control: max-age=240s` — just under the 5-min signature lifetime, so
   the browser never caches a 302 pointing at an expired signature.

## GCS bucket setup (one-time)

Bucket creation, a bucket-scoped service account, HMAC keys, and CORS are
covered step-by-step in `storage.md` §4. Key points: one bucket per env
(`-dev`/`-staging`/`-prod`), service account scoped to the bucket (not the
project), CORS allow-list limited to the portal origins, HMAC creds only in the
secret store.

## Security invariants (don't regress these)

- Bucket is private; reads go through presigned GET or the `/api/images` proxy.
- `/api/images` serves only `materiales` + `servicios`; widening
  `PUBLIC_CATEGORIES` would leak client IP / financial docs.
- Uploads require auth, are rate-limited, and are size + mime validated
  **before** a presign is issued.
- Keys are server-minted UUIDs; original filenames live in Postgres, not the key.
- `cotizaciones` are server-write-only.

## Known limits

- Rate limiter is in-memory (per-instance) — see [auth.md](./auth.md) gotchas.
- S3 multipart isn't 1:1 on GCS; fine for current asset sizes (images ≤10 MB,
  design files ≤25 MB). Large/resumable uploads would need a different path.
- CORS is configured on the GCS bucket, not via the S3 API.
