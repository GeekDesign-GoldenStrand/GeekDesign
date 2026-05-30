# STRIDE security audit — remediation tracker

Owner: Enrique Ayala (`KIKW12` / `enayala`). Records the security audit that
ran against the whole `portal-geek` app, what's been fixed, and what's still
on the work-list. Read this when picking up the next remediation, when
reviewing a security-touching PR, or when reasoning about why a particular
schema/guard/check exists.

Related: [auth.md](./auth.md), [rbac.md](./rbac.md),
[storage-architecture.md](./storage-architecture.md).

## What STRIDE is

A threat-modelling framework that taxonomises risks into six categories so a
review is systematic, not vibes-based:

| Letter | Category               | One-liner                                                   |
| ------ | ---------------------- | ----------------------------------------------------------- |
| S      | Spoofing               | Pretending to be another principal (user/session/service).  |
| T      | Tampering              | Altering data the system trusts.                            |
| R      | Repudiation            | Denying that an action happened — no audit trail to refute. |
| I      | Information Disclosure | Leaking data to a principal that shouldn't see it.          |
| D      | Denial of Service      | Making the system unavailable or expensive for legit users. |
| E      | Elevation of Privilege | Acting with more authority than the principal actually has. |

Findings throughout this doc are numbered with their category letter
(S1, T3, …) so commit messages and code comments stay traceable.

## Scope and method

Six specialist passes were run in parallel:

1. **Spoofing / Auth surface** — login, JWT, password reset, magic-link, cookie flags.
2. **Tampering + Info Disclosure** — API routes, IDOR, mass-assignment, upload safety.
3. **Repudiation + DoS + EoP** — audit logging, rate limits, RBAC enforcement.
4. **UI/UX: Navigation + IA** — admin shell, routing, breadcrumbs, deep-link.
5. **UI/UX: Forms + feedback** — validation, modals, toasts, destructive UX.
6. **UI/UX: Accessibility + visual** — focus, ARIA, contrast, semantic HTML.

This document tracks the **STRIDE** half (passes 1-3). The UX half has its
own remediation track and lives outside the scope of this file.

## Findings at a glance

The audit produced **~70 STRIDE findings** across the codebase. Severity
distribution (own-buckets, ordered by exploitability × blast radius):

| Severity | Count | Examples                                                |
| -------- | ----- | ------------------------------------------------------- |
| Critical | 1     | R1 (no audit trail for user CRUD / role change)         |
| High     | 14    | T1, T2, T3, T4, T5, R2-R4, D1-D3, S1, S2, I1/E2, I2, E1 |
| Medium   | ~25   | T6-T9, R5-R7, D4-D8, E3-E5, S3-S9, I3-I7                |
| Low/Info | ~30   | logging hygiene, copy fixes, defense-in-depth refactors |

The "long tail" of low/info findings is not enumerated here — they are
documented in the original audit synthesis and will be picked up
opportunistically.

## Solid foundation (preserve these)

The audit also flagged what's **right**. These are load-bearing controls;
don't regress them while touching the surrounding code:

- **Single-source RBAC** in `lib/auth/access.ts` is wired through the edge
  proxy, API guards, and page layouts (three-layer defence).
- The legacy `Administrador` role is normalised to `Direccion` once at the
  JWT boundary (`verifyToken`); downstream code can't be tricked by raw role.
- Login intentionally returns the same 401 for missing/inactive/wrong/
  throttled — closes the enumeration shape.
- Magic-link tokens (password reset, cotización access) are SHA-256-hashed
  at rest, single-use via the `usado` flag, and accompanied by neutral
  responses on `/access-link`.
- Cotización session JWT is bound to `id_cotizacion` (`verifySessionFor`) —
  folio-A's token cannot act on folio-B.
- Server-side price recomputation in `createCotizacionFromCart` — client
  `precio` is never trusted.
- Cliente upsert anti-takeover: `update: {}` prevents PII overwrite by
  anonymous storefront submissions.
- `getClientIp` reads the rightmost `X-Forwarded-For` (correct for GCP).
- Bcrypt cost 12; `AUTH_SECRET` length is asserted at sign time.
- `changePassword` requires the current password.
- Pedido + cotización status changes are audited via
  `HistorialEstadosPedidos` / `HistorialEstadosCotizacion`.
- `expr-eval` runs with `assignment: false, fndef: false` — formulas can't
  escape into statements.
- Most list endpoints cap `pageSize` at 100.

## Remediation status

Findings move through **pending → in-progress → committed**. Each finding ID
matches a comment in the code (`// T4: …`, `// PE-05`, etc.) and a line in
the commit message that landed it. Search the codebase by finding ID to
locate the enforcement point.

### Committed

#### Sprint 1 — security floor

Defensive floors that don't change behaviour for legitimate users.

| ID  | Title                                                           | Where                                                                                                      |
| --- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| D1  | Cap `pageSize` at 100 on `GET /api/cotizaciones`                | `app/api/cotizaciones/route.ts`                                                                            |
| S10 | Refuse to boot when prod is configured without auth             | `instrumentation.ts` (boot assertion), `proxy.ts` (runtime backstop)                                       |
| D3  | Rate-limit `/api/auth/forgot-password` (5/15min per IP)         | `app/api/auth/forgot-password/route.ts`                                                                    |
| D4  | Rate-limit `/api/auth/reset-password` + `establecer-contrasena` | `app/api/auth/reset-password/route.ts`, `app/api/auth/establecer-contrasena/route.ts`                      |
| E3  | `requireSection` on cotizaciones + sucursales pages             | already mitigated by nested `layout.tsx` calling `requireSection` — audit false-positive, no change needed |

#### Sprint 2a — schema hardening + PE-05

Closing mass-assignment vectors and within-section access refinements.

| ID    | Title                                                                                                         | Where                                                                                                                              |
| ----- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| T1    | Drop `id_estatus`, `id_sucursal`, `facturado`, `numero_factura` from `UpdatePedidoSchema`                     | `lib/schemas/pedidos.ts`                                                                                                           |
| T2+T7 | Drop `id_estatus_cotizacion`, `pdf_url`, `fecha_validacion`, `fecha_aprobacion` from `UpdateCotizacionSchema` | `lib/schemas/cotizaciones.ts`, `lib/services/cotizaciones.ts` (dead branches removed)                                              |
| I1/E2 | PE-05 — pedido detail view locked to Dirección                                                                | `app/api/pedidos/[id]/route.ts` (`withRoleParams(['Direccion'])`), `app/(admin)/pedidos/[id]/page.tsx` (new `requireRoles` helper) |

The new `requireRoles(roles)` helper in `lib/auth/page-guard.ts` is the
within-section refinement pattern — use it whenever a single page must be
narrower than its section's `read` row in `SECTION_ACCESS`.

#### Sprint 3a — upload + storage hardening

Closing four interacting upload-path vulnerabilities. Each finding limits a
different abuse vector; together they cover declared-type, size, key-leak,
and body-content lies.

| ID  | Title                                                                                         | Where                                                                                                                                                                                                                                        |
| --- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T3  | Force `attachment` disposition on `disenios/*` GETs (close SVG-with-script XSS)               | `lib/services/storage.ts` `presignGet`                                                                                                                                                                                                       |
| T4  | Bind `ContentLength` into the presigned PUT signature (cap body to declared size)             | `lib/services/storage.ts` `presignPut`; both `/api/upload` and `/api/upload/disenios` pass `body.size` through                                                                                                                               |
| T5  | HMAC delete-token for the public disenios DELETE (a leaked key alone no longer grants delete) | new `lib/utils/upload-token.ts`; `app/api/upload/disenios/route.ts`; `uploadFile`/`uploadDesignFile`/`deleteDesignFile` API shape change; `DesignUploadZone`                                                                                 |
| T6  | Server-side magic-byte sniff before persisting an image reference (catches SVG-as-PNG bypass) | `lib/services/storage.ts` `assertObjectIsImage`; called from `createMaterial`/`createGrupo`/`createSubMaterial`/`updateMaterial` and `createServicio`/`updateServicio` (servicios diffs against existing keys to avoid redundant Range GETs) |

### Pending

Grouped by the original sprint, ordered roughly by cost.

#### Sprint 2 leftovers — audit + session integrity

| ID    | Title                                                                                                                                                                                                                      | Cost                                                     |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| S2    | `gd_session` cookie SameSite=`strict` (was `lax`); closes the residual CSRF surface around top-level POSTs                                                                                                                 | trivial — 1-line change in `app/api/auth/login/route.ts` |
| S1    | `verify-reset` hardening: validate token against the DB before setting the `reset_token` cookie; convert the GET cookie-set into a two-step POST so email scanners can't burn the token and `<img src>` can't pin a victim | small                                                    |
| E1    | `pwd_version` JWT claim — password changes invalidate other active 8h JWTs. New `password_version` column on `Usuarios`; bumped on every password mutation; `verifyToken` rejects stale                                    | small (Prisma migration + 2 service paths)               |
| R1-R4 | `AuditLog` table + helper wired into usuarios CRUD, password mutations, discount apply/remove, gastos/pagos. Captures actor/before/after for every privileged write                                                        | medium (Prisma migration + ~8 service call sites)        |

#### Sprint 3 leftovers — IDOR + DoS

| ID  | Title                                                                                                                                                                                                                     | Cost                                  |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| D2  | Migrate `lib/utils/rate-limit.ts` from in-process `Map` to App Engine memcache. Current limiter × `max_instances: 4` gives login 20/15min instead of 5/15min across the fleet                                             | medium — touches every limiter caller |
| I2  | Cross-sucursal IDOR. Add `id_sucursal` to JWT claims + `getSession`; enforce `where.id_sucursal = session.id_sucursal` in the service layer for non-Dirección on every list/detail. Biggest single fix in the whole audit | large — half a day plus               |
| I4  | `GET /api/admin/archivos/[id]` scoped to the user's sucursal (currently any Dirección can iterate IDs). Depends on I2                                                                                                     | small once I2 is in                   |

### Long tail (low/info)

Not enumerated here. Pick up opportunistically while touching adjacent
code. The original audit synthesis lists every item with its file:line.

## How to extend this tracker

1. Each finding has a stable ID (`T3`, `S10`, `PE-05`, etc.). Use it in
   comments next to the enforcement point — `grep -rn "T3"` should always
   land you somewhere meaningful.
2. The commit message that closes a finding mentions the ID. Use
   `git log --oneline | grep -E 'T3|S10'` to find when a control landed.
3. When a finding is closed, move its row from **Pending** to the matching
   **Committed** sprint section, with the file path it lives in.
4. When a new finding surfaces (whether from a future audit or a routine
   review), add it under **Pending** with a fresh ID and triage notes.

## Reading the code

Every enforcement point this audit added is grouped under one of:

- `lib/auth/` — session, JWT, RBAC matrix, page/route guards.
- `lib/schemas/` — Zod schemas. Mass-assignment vectors live here.
- `lib/services/storage.ts` — presign + magic-byte sniff.
- `lib/utils/upload-token.ts` — HMAC delete-token (T5).
- `lib/utils/rate-limit.ts` — in-process sliding-window limiter (D2 target).
- `proxy.ts` — edge gate, runtime backstop for `SKIP_AUTH`.
- `instrumentation.ts` — boot-time assertion against unsafe prod config.

When in doubt, search the codebase by audit finding ID. Comments next to
the enforcement point explain _why_, with a reference back to this doc.
