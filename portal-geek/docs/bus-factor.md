# Bus-Factor Handoff — Enrique Ayala's areas

Scope: **only the responsibilities owned by Enrique Ayala (`KIKW12` / `enayala`).**
CI/tooling/scaffold (Carlos Martínez Vázquez) and team-level process decisions
(e.g. who takes merges going forward) are deliberately out of scope here — this
doc covers what one person can hand off without depending on anyone else.

Audit framing: Enrique is the structural architect/integrator — AUTH, the
route-collision refactor + App Router topology, the storage layer, and the most
frequent integrator (~21 of ~87 merges). The risk: his work is a prerequisite
for everything, and the integration knowledge is tacit.

## 1. Subsystem knowledge — DONE

The three systems are documented as-built:

- [`auth.md`](./auth.md) — authentication & authorization.
- [`routing-topology.md`](./routing-topology.md) — route groups & the `/tienda` collision fix.
- [`storage-architecture.md`](./storage-architecture.md) — S3-compatible storage layer.

Each leads with an owner line, a file map, env vars, flow diagrams, and a
"don't-regress" section. **Honest status:** this transfers the _knowledge_, not
yet the _capability_ — a doc is proven only once a teammate lands a real change
using it alone. That validation step needs another person, so it's outside
"from my side only." What I can do is make the docs good enough that they can.

## 2. The integrator practice — the tacit part, captured below

This is the piece of Enrique's role that no subsystem doc covered: how
integration/merges actually get done. Writing it down is the part of the
bus-factor that _is_ within his control.

### Branch model

Three-tier promotion: **`develop` → `staging` → `main`**.

- **`develop`** — active integration branch. Feature/hotfix/refactor branches
  branch off it and merge back via PR.
- **`staging`** — pre-release. `develop` is promoted into it via PR
  (e.g. `Merge pull request #29 from .../develop`), not by merging features
  directly.
- **`main`** — released/stable; promoted from `staging` via PR.
- Naming (observed): `feature/<TICKET>-<short-desc>`, `hotfix/<short-desc>`,
  `refactor/<short-desc>`, under the `GeekDesign-GoldenStrand/` org namespace.
- PRs use `.github/PULL_REQUEST_TEMPLATE.md`; CI is `.github/workflows/ci.yml`
  (owned outside this doc — must be green before merge).

> **Promotion direction is one-way per tier.** Land features on `develop`;
> never merge a feature branch straight into `staging` or `main`. Promote whole
> tiers (`develop`→`staging`, `staging`→`main`) via PR so each environment gets
> a coherent, CI-verified snapshot rather than cherry-picked commits.

### What "integrating a PR" actually involves (the checklist Enrique runs)

1. **CI green** + required reviews in.
2. **Pull `develop` into the feature branch first**, resolve conflicts on the
   feature side — never resolve them in the merge commit. (See the repeated
   `Merge branch 'develop' into <feature>` commits in history.)
3. **Conflict hot-spots to watch** (where most integration pain lives):
   - **Prisma schema / migrations / seeds** — concurrent migrations collide and
     autoincrement sequences drift. Several `fix:` commits address exactly this
     (`autoincrement sequences for the prisma db`, `database migrations, seeds
and connections fixed for both dev and prod`). Re-run migrations + seed
     locally after resolving, don't trust a clean text merge.
   - **`app/` route tree** — two route groups can silently claim the same URL;
     a clean merge can still produce a build-time route collision. See
     [`routing-topology.md`](./routing-topology.md). Run `next build` after
     merging route changes.
   - **Auth guards on new API routes** — a merged route with no
     `withAuth`/`withRole` ships unauthenticated (the `proxy.ts` edge middleware
     gates pages, not `/api/*`). Grep new `app/api/**/route.ts` for an exported
     handler that isn't wrapped. See [`auth.md`](./auth.md).
   - **`.env.example`** — new vars must be added or downstream branches break at
     boot.
4. **Build + test locally** (not just CI) when the PR touches schema, routes, or
   storage.
5. Merge via PR (merge commit, not squash — matches existing history).

### After merge

- If a hotfix went to `staging`/`main`, back-merge down to `develop` (and
  `staging`) so the tiers don't diverge.
- If schema changed, tell the team to re-run migrations/seed.

> **⚠️ `main` is currently far behind `staging`** (hundreds of commits). When
> `staging` is promoted to `main`, expect a large, auth-heavy merge. One
> concrete file-level conflict to plan for: the edge middleware was **renamed**
> from `middleware.ts` to `proxy.ts` for Next.js 16 (commit `ce604f3`). The
> current branches use `proxy.ts`; `main` still has `middleware.ts`. These are
> the **same auth layer under different filenames** — a naive merge can leave
> _both_ files present (Next would then ignore the deprecated one, or behave
> unexpectedly). Resolve by keeping `proxy.ts` and deleting `middleware.ts`.
> The current auth design is bcrypt + stateless JWT with the three-layer
> enforcement in [`auth.md`](./auth.md).

## 3. What is explicitly NOT closed by this doc

So nobody mistakes "documented" for "solved":

- **Merge/integration is still concentrated on one person.** This doc lets
  someone else _do_ it; it doesn't make them do it. Spreading the duty is a team
  decision, out of scope here.
- **CI / tooling / scaffold** concentration (Carlos's area) is untouched.
- **Docs are single-author** (Enrique's mental model). They get durable once a
  second person edits them after using them.
