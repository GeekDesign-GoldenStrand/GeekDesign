/**
 * @jest-environment node
 */

import { can, sectionForPath, SECTION_ACCESS } from "@/lib/auth/access";
import type { Role, Section, Action } from "@/lib/auth/access";

// The intended access matrix, written out independently of SECTION_ACCESS so an
// accidental edit to the policy is caught here. Grounded in the SRS §2.2
// *Actividades* column (system permissions), not "Formación o conocimientos":
//   - Colaborador: only pedidos (consult + update status).
//   - Finanzas: pedidos (invoicing) + finanzas.
//   - Everything else is Dirección-only (§2.3.1 rules 3–6 reserve métricas, user
//     roles, services catalog, and formulas to Dirección).
const ALL_ROLES: Role[] = ["Direccion", "Colaborador", "Finanzas"];

const EXPECTED: Record<Section, { read: Role[]; write: Role[] }> = {
  pedidos: { read: ["Direccion", "Colaborador", "Finanzas"], write: ["Direccion", "Colaborador"] },
  finanzas: { read: ["Direccion", "Finanzas"], write: ["Direccion", "Finanzas"] },
  metricas: { read: ["Direccion"], write: ["Direccion"] },
  usuarios: { read: ["Direccion"], write: ["Direccion"] },
  servicios: { read: ["Direccion"], write: ["Direccion"] },
  cotizaciones: { read: ["Direccion"], write: ["Direccion"] },
  materiales: { read: ["Direccion"], write: ["Direccion"] },
  proveedores: { read: ["Direccion"], write: ["Direccion"] },
  terceros: { read: ["Direccion"], write: ["Direccion"] },
  instaladores: { read: ["Direccion"], write: ["Direccion"] },
  maquinas: { read: ["Direccion"], write: ["Direccion"] },
  clientes: { read: ["Direccion"], write: ["Direccion"] },
  colaboradores: { read: ["Direccion"], write: ["Direccion"] },
  sucursales: { read: ["Direccion"], write: ["Direccion"] },
};

const sections = Object.keys(EXPECTED) as Section[];

describe("RBAC policy matrix — can(role, section, action)", () => {
  it("covers every section defined in SECTION_ACCESS (no drift in either direction)", () => {
    expect(sections.sort()).toEqual((Object.keys(SECTION_ACCESS) as Section[]).sort());
  });

  describe.each(sections)("section: %s", (section) => {
    describe.each(["read", "write"] as Action[])("action: %s", (action) => {
      it.each(ALL_ROLES)("%s matches the intended matrix", (role) => {
        const allowed = EXPECTED[section][action].includes(role);
        expect(can(role, section, action)).toBe(allowed);
      });
    });
  });

  it("write ⊆ read for every section (a writer can always read)", () => {
    for (const section of sections) {
      for (const role of ALL_ROLES) {
        if (can(role, section, "write")) {
          expect(can(role, section, "read")).toBe(true);
        }
      }
    }
  });

  // SRS §2.3.1 rules 3–6: only Dirección may reach these.
  it.each(["metricas", "usuarios", "servicios"] as Section[])(
    "%s is Dirección-only for write",
    (section) => {
      expect(can("Direccion", section, "write")).toBe(true);
      expect(can("Colaborador", section, "write")).toBe(false);
      expect(can("Finanzas", section, "write")).toBe(false);
    }
  );

  // Colaborador's only system activity is pedidos (consult + update status).
  it("Colaborador may read+write pedidos but nothing else", () => {
    expect(can("Colaborador", "pedidos", "read")).toBe(true);
    expect(can("Colaborador", "pedidos", "write")).toBe(true);
    for (const section of sections.filter((s) => s !== "pedidos")) {
      expect(can("Colaborador", section, "read")).toBe(false);
      expect(can("Colaborador", section, "write")).toBe(false);
    }
  });

  // Finanzas may consult pedidos and own the finanzas section; nothing else.
  it("Finanzas is limited to pedidos (read) and finanzas (read+write)", () => {
    expect(can("Finanzas", "pedidos", "read")).toBe(true);
    expect(can("Finanzas", "finanzas", "read")).toBe(true);
    expect(can("Finanzas", "finanzas", "write")).toBe(true);
    for (const section of sections.filter((s) => s !== "pedidos" && s !== "finanzas")) {
      expect(can("Finanzas", section, "read")).toBe(false);
    }
  });
});

describe("sectionForPath", () => {
  it.each([
    ["/pedidos", "pedidos"],
    ["/pedidos/123", "pedidos"],
    ["/pedidos/123/estatus", "pedidos"],
    ["/cotizaciones", "cotizaciones"],
    ["/materiales/5/proveedores", "materiales"],
    ["/finanzas", "finanzas"],
    ["/usuarios", "usuarios"],
  ])("maps %s → %s", (path, expected) => {
    expect(sectionForPath(path)).toBe(expected);
  });

  it.each(["/dashboard", "/perfil", "/login", "/", "/dashboard/anything"])(
    "returns null for non-gated path %s",
    (path) => {
      expect(sectionForPath(path)).toBeNull();
    }
  );

  it("does not match on a partial segment prefix (/pedidosX is not /pedidos)", () => {
    expect(sectionForPath("/pedidosX")).toBeNull();
  });
});
