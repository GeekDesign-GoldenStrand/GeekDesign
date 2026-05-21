# Authentication & Authorization (as-built)

Owner: Enrique Ayala (`KIKW12` / `enayala`). This documents the auth system as
it actually exists in the code so anyone can run, debug, and extend it without
the original author.

Related: [routing topology](./routing-topology.md) (how route groups enforce
auth at the page level), [storage architecture](./storage-architecture.md)
(upload routes sit behind `withAuth`).

## TL;DR

- **Stateless JWT** signed with `HS256` (`jose`), 8-hour expiry, carried in an
  **httpOnly cookie** named `gd_session`.
- **No `middleware.ts`.** Auth is enforced in two places instead:
  1. **Server layouts** (`app/(admin)/layout.tsx`) — `getSession()` →
     `redirect("/login")` for the whole admin route group.
  2. **API route guards** (`withAuth` / `withRole`) — wrap each handler.
- Passwords hashed with **bcrypt, 12 salt rounds**.
- Roles `Direccion` and `Administrador` are treated as interchangeable admins.

## Files

| File | Responsibility |
| --- | --- |
| `lib/auth/password.ts` | `hashPassword` / `verifyPassword` (bcrypt, 12 rounds). |
| `lib/auth/tokens.ts` | `generateToken` / `verifyToken` (JWT, HS256, 8h). |
| `lib/auth/session.ts` | `getSession()` reads `gd_session` cookie → `SessionPayload`. |
| `lib/auth/guards.ts` | `withAuth`, `withRole`, `withAuthParams`, `withRoleParams`. |
| `lib/services/auth.ts` | `loginUser(email, password)` — DB lookup + verify + token. |
| `lib/schemas/auth.ts` | Zod schemas for login / forgot / reset / change password. |
| `app/api/auth/*` | `login`, `logout`, `forgot-password`, `reset-password`, `change-password`. |
| `app/(auth)/*` | Login / recover / change-password pages. |

## Environment

```dotenv
# Must be >= 32 chars or token generation throws at first use.
AUTH_SECRET="<random 32+ char secret>"
```

`lib/auth/tokens.ts` validates this length on every sign/verify; a short or
missing secret fails loudly rather than producing weak tokens.

## Login flow

```
POST /api/auth/login  { email, password }
  ├─ rate limit: 5 attempts / 15 min per IP (x-forwarded-for)
  ├─ LoginSchema.parse  (zod: email <=150, password 1..255)
  ├─ loginUser():
  │    ├─ normalize email (trim + lowercase)
  │    ├─ prisma.usuarios.findUnique + include rol
  │    ├─ reject if missing OR estatus !== "Activo"   ← same error as bad pw
  │    ├─ verifyPassword (bcrypt.compare)
  │    ├─ generateToken({ id, email, rol })
  │    └─ update ultimo_acceso
  └─ Set-Cookie gd_session=<jwt>  (httpOnly, sameSite=lax,
                                    secure in prod, maxAge 8h, path=/)
```

**Information-leak hygiene:** unknown user, inactive user, wrong password, and
rate-limit-exceeded all return the same `401 "Credenciales inválidas"`. Don't
"helpfully" differentiate these — it's deliberate.

**Logout** (`POST /api/auth/logout`) just deletes the cookie; the JWT remains
technically valid until expiry (stateless — there is no server-side denylist).

## Authorization

`SessionPayload = { id: number, email: string, role: UserRole }`.

### Page level
Each protected route group has a server-component layout that calls
`getSession()` and redirects unauthenticated users. See
`app/(admin)/layout.tsx`. This is the first gate for `(admin)` pages.

### API level — guards (`lib/auth/guards.ts`)

```ts
export const POST = withAuth(async (req, session) => { ... });          // any logged-in user
export const POST = withRole(["Administrador"], async (req, session) => { ... }); // specific roles
export const GET  = withAuthParams<{ id: string }>(async (req, ctx, session) => { ... }); // + dynamic params
export const PUT  = withRoleParams(["Direccion"], async (req, ctx, session) => { ... });
```

**Admin elevation rule:** `ADMIN_ROLES = ["Direccion", "Administrador"]`. Any
route that allows *either* admin role implicitly allows *both* — `resolveSession`
unions `ADMIN_ROLES` into the allow-list. So you cannot grant `Administrador`
without also granting `Direccion`. Keep this in mind when adding finer roles.

Guards centralize error handling: `UnauthorizedError` → 401, `ForbiddenError`
→ 403 via `handleError`.

## Tokens

- Alg `HS256`, claims `{ id, email, rol }`, `iat` + `exp` (8h).
- `verifyToken` returns `null` on any failure (bad signature, expiry,
  malformed claims) — callers treat `null` as "no session." It never throws.
- Cookie name and max-age live in `lib/auth/session.ts`
  (`SESSION_COOKIE`, `SESSION_MAX_AGE_SECONDS = 8h`). Keep cookie maxAge and
  JWT `exp` in sync if you change either.

## Password rules (reset / change, `lib/schemas/auth.ts`)

≥ 8 chars, at least one uppercase, at least one digit, plus a confirm-match
refinement. Login itself only requires non-empty (so legacy/short passwords can
still authenticate); the strength rules apply when *setting* a password.

## Tests

- `__tests__/unit/auth.test.ts` — password hashing, session resolution.
- `__tests__/unit/auth-schemas.test.ts` — zod schema edge cases.
- `__tests__/integration/api-auth.test.ts` — login route end-to-end.

## Gotchas / things that will bite you

- **There is no middleware.** Adding a page outside a guarded route group (or an
  API route without a guard) ships it unauthenticated. New `(admin)` pages are
  covered by the group layout; new API routes must opt in with `withAuth`/`withRole`.
- **`secure` cookie only in production** — local dev over http works because
  `secure` is gated on `NODE_ENV === "production"`.
- **Stateless logout** — there's no token revocation. If you need forced
  logout/ban, you'd add a server-side check (e.g. a `token_version` on the user
  compared in `getSession`).
- **Rate limiter is in-memory** (`lib/utils/rate-limit.ts`) — per-instance, not
  shared across serverless instances. Fine for the current single-instance
  deploy; revisit if horizontally scaled.
