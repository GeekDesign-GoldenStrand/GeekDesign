# App Router Topology & the Route-Collision Refactor (as-built)

Owner: Enrique Ayala (`KIKW12` / `enayala`). Documents how the Next.js App
Router is organized and *why*, so the structure isn't accidentally broken by
future feature work.

Related: [auth](./auth.md) (route groups are where page-level auth is enforced),
[storage architecture](./storage-architecture.md) (`/api/images` proxy).

## Three route groups

The app is split into three [route groups](https://nextjs.org/docs/app/building-your-application/routing/route-groups)
(parenthesized folders don't appear in the URL):

| Group | URL prefix | Layout enforces | Audience |
| --- | --- | --- | --- |
| `app/(auth)/` | `/login`, `/recuperar-contrasena`, `/cambiar-contrasena` | — (public) | Anyone |
| `app/(admin)/` | `/dashboard`, `/clientes`, `/pedidos`, … | `getSession()` → redirect `/login` | Staff |
| `app/(storefront)/` | `/tienda/...` | — (public storefront) | Customers |

Each group owns its own `layout.tsx` and `icon.ico`, so the admin portal,
the auth screens, and the public storefront have independent chrome and
independent auth posture.

## The collision that was fixed

Commit `f6da4af` — *"move storefront routes under /tienda and fix
admin/storefront namespace collision"*.

**The problem:** route groups are invisible in the URL. So
`app/(admin)/servicios/` and `app/(storefront)/servicios/` both resolved to
`/servicios` — two different pages claiming the same path. Next.js treats this
as a hard build error (parallel pages resolving to the same route). The same
clash existed for `catalogo`, `cotizacion`, `promocionales`, etc.

**The fix:** all storefront pages were moved under a real, URL-visible
`tienda/` segment:

```
app/(storefront)/servicios/...   →   app/(storefront)/tienda/servicios/...
app/(storefront)/catalogo/...    →   app/(storefront)/tienda/catalogo/...
app/(storefront)/storefront/     →   app/(storefront)/tienda/   (the index)
```

Now admin lives at `/servicios` and the public storefront at
`/tienda/servicios` — no overlap. The `(storefront)` group stays for the shared
layout; `tienda/` is the actual namespace.

## The rule going forward

> **Two pages may share a path only if their route groups produce different
> URLs.** Because groups are URL-invisible, give each group a distinct
> URL-visible prefix when names would otherwise collide.

- Admin pages: no prefix, live at the bare resource name (`/clientes`,
  `/materiales`).
- Storefront pages: **always** under `/tienda/...`.
- Auth pages: their own distinct slugs (`/login`, etc.).

If you add a storefront page, put it under `app/(storefront)/tienda/`. If you
add an admin page whose name also exists in the storefront, you're fine — the
storefront copy is namespaced under `/tienda`.

## API routes

`app/api/` is a flat namespace (no route groups). Conventions in place:

- Resource collections + `[id]` detail: `app/api/clientes`, `app/api/clientes/[id]`.
- Sub-resources nest: `app/api/cotizaciones/[id]/approve`,
  `app/api/maquinas/[id]/sucursales`.
- Auth endpoints under `app/api/auth/*`.
- **Public** read proxy: `app/api/images/[...key]` (catch-all) — the only
  storefront-facing, unauthenticated API route. See storage docs.

Auth on API routes is **per-handler** via guards (`withAuth`/`withRole`), not
via the route group — there is no `middleware.ts`. See [auth.md](./auth.md).

## Layouts inventory

Nested `layout.tsx` files (e.g. under `(admin)/cotizaciones`,
`(admin)/sucursales`, `(admin)/pedidos`) exist to scope section-specific
chrome/providers. The auth gate itself lives in the top-level
`app/(admin)/layout.tsx`; nested layouts inherit that protection because they
render inside it.
