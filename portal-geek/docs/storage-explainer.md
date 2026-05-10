# How Uploads Work — Team Explainer

A walkthrough of the upload mechanism in plain language. If you're going to touch storage code, or wire a new entity to it, read this first. Companion to [`storage.md`](./storage.md) (setup) and [`storage-todo.md`](./storage-todo.md) (what's left).

---

## The big idea in one sentence

The Next.js server **never holds the file bytes** — it tells the browser "here's a one-time URL, go upload directly to the bucket," and we just remember the path the bucket assigned to the file.

That's it. Everything else is consequences of that decision.

---

## Why we don't proxy uploads through the server

The naive way to upload a file is:

```
Browser  ──file──>  Next.js server  ──file──>  Bucket
```

That works, but it has three problems:

1. **The Next.js server has to read every byte of every upload.** A 25 MB design file from a client means our server CPU and bandwidth pay the cost. On Vercel and most serverless platforms, request bodies are also capped (usually 4–10 MB), so it just _doesn't work_ for big files.
2. **It doubles latency** — bytes go up to the server, then up to the bucket.
3. **It doesn't scale per-user** — ten clients uploading at once choke the same Next.js process.

The better way is **presigned uploads**:

```
Browser  ──"can I upload?"──>  Next.js server  (validates, signs)
Browser  <──signed URL+key──   Next.js
Browser  ──file──>  Bucket directly
Browser  ──"done, key is X"──>  Next.js server  (saves X in Postgres)
```

The server only ever handles tiny JSON, never the actual file. The bucket does the heavy lifting.

---

## What is a "key"?

A **key** is the path of the file _inside the bucket_. It looks like:

```
materiales/2026/05/3f4c2b8a-1d72-4e91-b3f5-e8a01c2d4f6e.jpg
```

Three things to notice:

1. **Category prefix** (`materiales/`) — tells us what kind of file it is. Useful for permissions, lifecycle rules, and quick "what's in the bucket" sanity.
2. **Year/month** (`2026/05/`) — keeps directory listings reasonable as the bucket grows. Also lets us write rules like "delete everything in `disenios/2024/` after 2 years."
3. **UUID + sanitized extension** — never the user's filename. Two reasons: filenames have weird characters that break URLs and tooling, and they leak information (you don't want `juans-secret-design-final-v3.ai` showing up in logs). The original filename is stored in Postgres alongside the key when we need it for downloads.

The function that builds keys is `buildKey(category, ext)` in `lib/storage/keys.ts`. It's the **only** way keys should be created. Never hand-craft a key string.

---

## The flow, step by step

Here's a real upload (a colaborador uploading an image for a new material):

### Step 1 — User picks a file

They click a `<input type="file">`. The browser hands the React app a `File` object: `{ name: "acrilico.jpg", type: "image/jpeg", size: 482103 }`.

### Step 2 — Frontend asks our API for a presigned URL

```http
POST /api/upload
Content-Type: application/json

{
  "category": "materiales",
  "contentType": "image/jpeg",
  "size": 482103
}
```

Our route handler (`app/api/upload/route.ts`) does four things:

1. **Auth check** (`withAuth`) — only logged-in users can upload.
2. **Validation** — is the category real? Is the mime type allowed for that category? Is the file under the size cap? See `lib/schemas/upload.ts` for the per-category limits.
3. **Build a key** — `buildKey("materiales", "jpg")` → `materiales/2026/05/<uuid>.jpg`.
4. **Sign a URL** — `presignPut(key, contentType)` returns a URL like `https://storage.googleapis.com/<bucket>/materiales/...?X-Goog-Signature=...&X-Goog-Expires=300`. This URL is valid for 5 minutes and only for a `PUT` request with the matching `Content-Type`.

The response back to the browser:

```json
{
  "data": {
    "key": "materiales/2026/05/3f4c2b8a-....jpg",
    "url": "https://storage.googleapis.com/...",
    "expiresIn": 300
  },
  "error": null
}
```

### Step 3 — Browser uploads directly to the bucket

```js
await fetch(response.url, {
  method: "PUT",
  headers: { "Content-Type": "image/jpeg" },
  body: file,
});
```

This request **does not touch our server at all**. It goes from the user's browser straight to GCS (or AWS S3, or Oracle — whichever the env points at). The bucket validates the signature, sees the URL is still within its 5-minute window, accepts the bytes, and stores them at the key we picked.

This is also why CORS on the bucket matters: the browser needs to be told by the bucket "yes, allow PUTs from your origin." That's a one-time bucket configuration, not something the app code does.

### Step 4 — Frontend tells our API the upload finished

The browser still has the `key` from step 2. Now it submits whatever form contained the upload, with the key included:

```http
POST /api/materiales
{
  "nombre_material": "Acrílico espejo",
  "imagen_url": "materiales/2026/05/3f4c2b8a-....jpg",
  ...
}
```

Yes, the field is called `imagen_url` even though it stores a key. We kept the column name to avoid a breaking migration; semantically it's a key now. The Zod validator on this field (`lib/schemas/materiales.ts`) checks that the value matches the shape `materiales/yyyy/mm/<uuid>.<ext>`. If you tried to send a random string, it would 422.

### Step 5 — Server persists the key

`createMaterial` writes the row. The `imagen_url` column now holds the key.

### Step 6 — Reads translate keys to URLs

When the frontend later asks `GET /api/materiales/123`, the server reads the row and **replaces** the stored key with a freshly-signed GET URL before returning it:

```ts
async function withResolvedImagen(material: Materiales): Promise<Materiales> {
  return { ...material, imagen_url: await resolveImageUrl(material.imagen_url) };
}
```

`resolveImageUrl` returns either:

- A public URL (if `STORAGE_PUBLIC_BASE_URL` is set and the bucket is public-read), or
- A short-lived presigned GET URL.

So the frontend always sees a fetchable URL. It never sees the raw key. The key only flows in the **opposite** direction: from the upload route → form submission → DB.

---

## A picture

```
┌─────────┐                   ┌──────────────┐                 ┌────────┐
│ Browser │                   │ Next.js API  │                 │ Bucket │
└────┬────┘                   └──────┬───────┘                 └────┬───┘
     │                               │                              │
     │  1) POST /api/upload          │                              │
     │  { category, mime, size }     │                              │
     │ ─────────────────────────────>│                              │
     │                               │  validate, buildKey, sign    │
     │                               │                              │
     │  { key, url, expiresIn }      │                              │
     │ <─────────────────────────────│                              │
     │                                                              │
     │  2) PUT <url>  body=file                                     │
     │ ───────────────────────────────────────────────────────────> │
     │                                                              │
     │  200 OK                                                      │
     │ <─────────────────────────────────────────────────────────── │
     │                                                              │
     │  3) POST /api/materiales      │                              │
     │  { ...form, imagen_url:key }  │                              │
     │ ─────────────────────────────>│                              │
     │                               │  Postgres INSERT             │
     │                               │                              │
     │  201 Created                  │                              │
     │  { ..., imagen_url: <signed── │ ─ resolveImageUrl(key) ───── │
     │  GET URL> }                   │                              │
     │ <─────────────────────────────│                              │
     │                                                              │
```

---

## The four moving parts in code

| Part    | File                      | What it does                                                                                                |
| ------- | ------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Client  | `lib/storage/client.ts`   | Singleton S3 SDK client pointed at GCS/S3/Oracle. Lazy-init so tests don't crash.                           |
| Keys    | `lib/storage/keys.ts`     | `buildKey`, `isValidKey`, `extFromMime`, `extFromFilename`, the `STORAGE_CATEGORIES` list.                  |
| Service | `lib/services/storage.ts` | The verbs you actually call: `presignPut`, `presignGet`, `resolveImageUrl`, `deleteObject`, `uploadBuffer`. |
| Route   | `app/api/upload/route.ts` | The one HTTP endpoint clients call to get a presigned PUT.                                                  |

If you're wiring a new entity, you don't touch `client.ts` or `keys.ts`. You just call `resolveImageUrl` on read paths and `deleteObject` on delete paths in your service file. See `lib/services/materiales.ts` for the full pattern.

---

## Why categories matter

`STORAGE_CATEGORIES` (in `lib/storage/keys.ts`) is the canonical list:

```ts
["materiales", "servicios", "disenios", "notas", "cotizaciones"];
```

Each one maps to a real domain concept and has its own rules in `UPLOAD_LIMITS`:

- **`materiales`** — material catalog images. Images only, 10 MB.
- **`servicios`** — service catalog images. Same limits as materiales.
- **`disenios`** — client design files attached to pedidos. 25 MB, accepts svg/ai/eps/dxf/pdf. Special: validated by **filename extension**, not mime, because `.ai` and `.eps` share `application/postscript` and `.dxf` has no standard mime.
- **`notas`** — file attachments on client notes. Images + PDF, 10 MB.
- **`cotizaciones`** — server-generated PDFs. Browser uploads to this category are **explicitly rejected** by the route. The server uses `uploadBuffer()` directly when generating cotización PDFs.

Each category is also the top-level prefix of every key it produces. That's how `isValidKey(key, "materiales")` knows whether a submitted key actually came from the right upload flow.

---

## Why presigned URLs are safe

A common worry: "if the upload URL is just a string, can't anyone use it?" Yes — and that's actually fine.

- **They expire.** Presigned URLs have a TTL (we use 5 minutes). After that the signature is invalid.
- **They're single-purpose.** A presigned PUT URL only lets you write to _exactly that key_ with _exactly that Content-Type_. You can't use it to read someone else's file or write to a different path.
- **The user already has access.** The server only signs the URL after `withAuth` confirms the user is logged in. If they're going to upload anyway, them holding the URL for 5 minutes is no different from them holding a session cookie.

The same logic applies to presigned GET URLs we hand out on read paths — they're scoped, expiring, and only issued to authenticated users.

---

## What can go wrong (and how the code handles it)

- **The upload to the bucket fails after the user got a presigned URL.** No row is created, the URL expires, nothing is leaked. The user retries and gets a new URL with a new key. The dead key is just an unused presigned URL — it doesn't reserve anything in the bucket.
- **The upload succeeds but the form submission fails.** Now the bucket has a real object, but no DB row references it. This is an **orphan**. It's the cost of the presigned pattern. Mitigations: a periodic GC job listing keys with no FK references (TODO — see storage-todo.md §5), or accept some orphan growth as the price of the architecture.
- **The user replaces an image.** `updateMaterial` notices `imagen_url` changed, takes the previous key from the DB, and `safeDelete`s the old object after the row update succeeds. Best-effort: a failed object delete logs the error but doesn't fail the request — the orphan can be cleaned up later, but a 500 to the user is worse.
- **The user deletes a material.** `deleteMaterial` reads the key inside the transaction, deletes the row, then `safeDelete`s the object. Same best-effort policy.
- **A user passes a forged key in the form** (e.g., someone else's key). The Zod validator checks the key shape and category prefix. They can't pass a key from the wrong category. They _could_ pass a real key that they happened to know belongs to another material — but they'd just be pointing their own row at someone else's image, which doesn't leak data they didn't already have access to (the image is theirs to view either way). If we ever store sensitive content this way, we'd add an ownership check; for catalog images it's fine.

---

## Adding storage to a new entity (recipe)

1. **Pick a category** in `STORAGE_CATEGORIES` (or add one if needed — also add limits to `UPLOAD_LIMITS`).
2. **In your zod schema**, validate the upload field with `isValidKey(v, "<category>")`.
3. **In your service file**, write a `withResolvedImagen` helper (or whatever the field is called) that swaps the stored key for a resolved URL. Call it on every read path — `get`, `list`, and the result of `create`/`update` so the API contract is consistent.
4. **In your service's update path**, if the key field changed, `safeDelete` the old key after the DB write succeeds.
5. **In your service's delete path**, capture the key before deleting the row, then `safeDelete` it after.
6. **Mock `@/lib/services/storage`** in your tests (see `__tests__/unit/materiales.test.ts` — the storage module is mocked at the top so tests don't need credentials).

`lib/services/materiales.ts` is the canonical reference. ~30 lines of additions to wire a new entity.

---

## TL;DR for the impatient

- File goes browser → bucket directly. Server is only consulted to get a 5-min "you may upload to this exact path" URL.
- We store the **key** (path inside the bucket), not the URL. URLs are generated fresh on read.
- Switching from GCS to AWS S3 to Oracle is an env-only change — code is provider-agnostic.
- Materiales is wired and is the template. Servicios, NotasCliente, ArchivosDisenio replicate the same pattern (see `storage-todo.md`).
