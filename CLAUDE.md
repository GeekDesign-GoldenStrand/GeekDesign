# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

The repo root holds `docker-compose.yml` (PostgreSQL 18 container) and the Next.js app lives one level down in `portal-geek/`. Almost every command below must be run from `portal-geek/`. The DB container is started from this root.

```
geekdesign/
├── docker-compose.yml      # postgres:18-alpine on localhost:5432
└── portal-geek/            # Next.js 16 app — run npm scripts from here
```

## Common commands (run from `portal-geek/`)

| Command | Purpose |
| --- | --- |
| `npm run dev` | Next.js dev server (http://localhost:3000) |
| `npm run build` | Production build — **also run after route changes** to catch App Router collisions |
| `npm run lint` / `npm run lint:fix` | ESLint (Next + Airbnb rules) |
| `npm run format` | Prettier |
| `npm test` | Jest (unit + integration). Single file: `npm test -- __tests__/unit/auth.test.ts`. Filter by name: `npm test -- -t "loginUser"` |
| `npm run test:watch` / `npm run test:coverage` | Watch / coverage |
| `npm run db:migrate` | `prisma migrate dev` (prompts for migration name) |
| `npm run db:generate` | Regenerate Prisma client after schema edits |
| `npm run db:seed` | `tsx prisma/seed.ts` — roles, statuses, demo client/product |
| `npm run db:studio` | Prisma Studio on localhost:5555 |

Database lifecycle (from repo root, **not** `portal-geek/`):

```bash
docker compose up -d        # start PG18 in background
docker compose down -v      # nuke container AND data (fresh start)
```

## Architecture — what requires multiple files to understand

Detailed as-built docs live in `portal-geek/docs/`: **read `auth.md`, `routing-topology.md`, and `storage-architecture.md` before touching those subsystems** — they document non-obvious invariants. Highlights:

### App Router has three route groups with a non-obvious collision rule

`app/(auth)/`, `app/(admin)/`, `app/(storefront)/` are URL-invisible groups. Because groups don't appear in the URL, admin and storefront pages with the same resource name (`servicios`, `catalogo`, ...) would resolve to the same path and break the build. The fix already in place: **all storefront pages live under a real `tienda/` segment** (`app/(storefront)/tienda/...`), admin pages keep the bare name. When adding a storefront page, put it under `app/(storefront)/tienda/`. Run `next build` after any route tree change — clean text merges can still produce route collisions.

### Auth is enforced in three layers — never rely on just one

1. **Edge middleware `proxy.ts`** (Next 16's renamed `middleware.ts`) — coarse path gate. **Off in development** (`NODE_ENV === "development"` or `SKIP_AUTH=true`) and no-ops if `AUTH_SECRET` is unset. Only gates page paths listed in `config.matcher` + `ADMIN_PATHS`; **does not gate `/api/*`**.
2. **`app/(admin)/layout.tsx`** — server-component `getSession()` → `redirect("/login")` for the whole admin group; nested admin layouts inherit it.
3. **API guards** in `lib/auth/guards.ts` — `withAuth`, `withRole`, `withAuthParams`, `withRoleParams`. **Every `app/api/**/route.ts` handler must be wrapped** — an unwrapped exported handler ships unauthenticated regardless of `proxy.ts`. Grep new routes for unwrapped exports during review.

Tokens: stateless JWT (HS256, `jose`), 8h expiry, httpOnly cookie `gd_session`. `AUTH_SECRET` must be ≥32 chars or token ops throw. Passwords: bcrypt 12 rounds. `Administrador` is a **legacy alias of `Direccion`** — `ADMIN_ROLES = ["Direccion", "Administrador"]` in `guards.ts` unions both; granting one grants the other. Target `Direccion` in new code. Login deliberately returns the same `401 "Credenciales inválidas"` for unknown user / inactive / wrong password / rate-limit — do not differentiate.

### Storage is provider-agnostic S3 + private bucket

AWS SDK v3 talks to **GCS today via HMAC**; swapping to S3/Oracle is env-only. `lib/storage/client.ts` is **lazy-initialized** (env read on first call, not import) so tests don't need credentials. Object keys are server-minted: `<category>/<yyyy>/<mm>/<uuid>.<ext>` where category ∈ `materiales|servicios|disenios|notas|cotizaciones`. Never use a user filename as a key.

Three read/write paths:
- **Upload:** `POST /api/upload` (auth + rate-limited + size/mime validated) returns a presigned PUT; browser PUTs directly to GCS with the **exact same `Content-Type`** (signature-bound). Server is never in the byte path. `cotizaciones` are server-write-only — browser PUT is 403.
- **Admin read:** short-lived `presignGet` (default 5 min, capped 15 min).
- **Public storefront read:** stable same-origin proxy `/api/images/[...key]` that 302-redirects to a fresh presigned GET. **Only `materiales` and `servicios` are allowed through** — widening `PUBLIC_CATEGORIES` would leak client IP (`disenios`), client-private notes, or financial docs (`cotizaciones`).

### Domain model lives in Prisma

`prisma/schema.prisma` is the authoritative model (Spanish table names, mapped via `@@map` to UPPER_SNAKE_CASE). It includes a custom **formula engine** (`Formulas`, `TiposVariable`, `FormulaConstantes`, `FormulaVariables`, `VariablesCotizacion`) for parametric pricing of services — see `lib/services/formula-pricing.ts`. Money fields are `Decimal`, not `Float`. After schema changes: `npm run db:generate`, then `npm run db:migrate`.

### Service layer

Business logic is centralized in `lib/services/*.ts` (auth, cotizaciones, materiales, pedidos, formula-pricing, storage, ...). API route handlers should stay thin — parse with a `lib/schemas/*.ts` Zod schema, then call a service.

## Branch model & merge hygiene

Three-tier promotion: **`develop` → `staging` → `main`** (PRs only; merge commits, not squash, to match history). Never merge feature branches directly into `staging`/`main`. Before merging anything that touches schema, routes, or storage: pull `develop` into the feature branch first (resolve conflicts on the feature side), then `next build` and re-run migrations/seed locally — clean text merges of Prisma migrations and the `app/` route tree can still break at build time. `.env.example` additions must land or downstream branches break at boot.

## Environment

Required (see `app.yaml.example`): `AUTH_SECRET` (≥32 chars), `DATABASE_URL`, the `STORAGE_*` block (`STORAGE_ENDPOINT`, `STORAGE_REGION`, `STORAGE_BUCKET`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`, optional `STORAGE_PUBLIC_BASE_URL`). Default `.env` values match the docker-compose Postgres.

## Tooling notes

- **Next.js 16** — middleware file is `proxy.ts`, not `middleware.ts` (the legacy name is deprecated). If a `main`-into-`staging` merge leaves both files, keep `proxy.ts`.
- **TypeScript path alias:** `@/*` → repo root (`portal-geek/`). Mirrored in `jest.config.js` `moduleNameMapper`.
- **Husky** is installed from `portal-geek/`'s `prepare` script but the hooks directory is `portal-geek/.husky` referenced from the parent. lint-staged runs `eslint --fix` + `prettier` on staged `.ts/.tsx`, prettier on other text files.
- **commitlint** uses conventional commits (`commitlint.config.mjs`).
- **Rate limiter** (`lib/utils/rate-limit.ts`) is in-memory / per-instance — fine for the current single-instance deploy.
