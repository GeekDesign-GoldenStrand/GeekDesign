// Single source of truth for role-based access (RBAC).
//
// Every layer — proxy.ts (edge), the admin layouts/pages, the API guards, and
// the sidebar — should derive its decisions from this module instead of keeping
// its own role list.
//
// "Administrador" is intentionally NOT a role here. It's a legacy alias that is
// normalized to "Direccion" in verifyToken before any code reads a role, so the
// rest of the app only ever reasons about the three canonical roles below.

export type Role = "Direccion" | "Colaborador" | "Finanzas";

export type Action = "read" | "write";

// Per-section access. By convention `write` ⊆ `read`: anyone who may write may
// also read. SRS §2.3.1 / §2.2 drive the primary sections; the secondary
// sections default to "Direccion writes, everyone reads" (pending stakeholder
// confirmation).
// Access follows the SRS §2.2 *Actividades* column (what each role may do in the
// system) — NOT the "Formación o conocimientos" column (the person's background
// knowledge). Colaborador's only activities are "consultar pedidos activos,
// actualizar estado de pedidos"; Finanzas's are consulting orders for invoicing
// and marking them facturado. Everything else is Direccion-only (§2.3.1).
export const SECTION_ACCESS = {
  // Pedidos: Direccion manages; Colaborador consults + updates status; Finanzas
  // consults orders needing invoicing. (Finanzas's status→"facturado" + invoice-
  // number write is not yet implemented in the routes, so write is [D, C] today.)
  pedidos: { read: ["Direccion", "Colaborador", "Finanzas"], write: ["Direccion", "Colaborador"] },

  // Expenses/payments — the Finanzas role's domain.
  finanzas: { read: ["Direccion", "Finanzas"], write: ["Direccion", "Finanzas"] },

  // Everything below is Direccion-only: not in the Colaborador/Finanzas
  // Actividades, and §2.3.1 rules 3–6 reserve métricas, user roles, the services
  // catalog, and the cotización formulas to Direccion.
  metricas: { read: ["Direccion"], write: ["Direccion"] },
  usuarios: { read: ["Direccion"], write: ["Direccion"] },
  servicios: { read: ["Direccion"], write: ["Direccion"] }, // catalog + formulas
  cotizaciones: { read: ["Direccion"], write: ["Direccion"] },
  materiales: { read: ["Direccion"], write: ["Direccion"] },
  proveedores: { read: ["Direccion"], write: ["Direccion"] },
  terceros: { read: ["Direccion"], write: ["Direccion"] },
  instaladores: { read: ["Direccion"], write: ["Direccion"] },
  maquinas: { read: ["Direccion"], write: ["Direccion"] },
  clientes: { read: ["Direccion"], write: ["Direccion"] },
  colaboradores: { read: ["Direccion"], write: ["Direccion"] },
  sucursales: { read: ["Direccion"], write: ["Direccion"] },
} satisfies Record<string, { read: Role[]; write: Role[] }>;

export type Section = keyof typeof SECTION_ACCESS;

// May `role` perform `action` on `section`?
export function can(role: Role, section: Section, action: Action): boolean {
  return (SECTION_ACCESS[section][action] as readonly Role[]).includes(role);
}

// Canonicalize a stored role. "Administrador" is a legacy alias of "Direccion"
// (see §2 of docs/rbac.md); every other value passes through. This is the single
// definition both verifyToken and the API guards use, so authorization never
// depends on an implicit role-widening rule.
export function normalizeRole(role: string): Role {
  return role === "Administrador" ? "Direccion" : (role as Role);
}

// Map a pathname to the section it belongs to. Returns null for paths that are
// not section-gated (e.g. /dashboard, /perfil) — those only require a valid
// session, not a specific role.
//
// Longest-prefix match so "/terceros/proveedores" resolves before "/terceros"
// would (the keys here are ordered most-specific first regardless).
export function sectionForPath(pathname: string): Section | null {
  const sections = Object.keys(SECTION_ACCESS) as Section[];
  const match = sections
    .filter((s) => pathname === `/${s}` || pathname.startsWith(`/${s}/`))
    .sort((a, b) => b.length - a.length)[0];
  return match ?? null;
}
