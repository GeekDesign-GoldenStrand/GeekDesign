/**
 * @jest-environment node
 *
 * ST-10/11/12 — SolicitarLeadSchema (guided solicitud: idea nula / vaga /
 * personalización). Mirrors the server-side validation the lead endpoint runs.
 */
import { SolicitarLeadSchema } from "@/lib/schemas/cotizaciones";

const baseCliente = {
  nombre_cliente: "Ana Cliente",
  correo_electronico: "ana@example.com",
  numero_telefono: "+524421234567",
};

const validBase = {
  tipo_solicitud: "idea_nula" as const,
  cliente: baseCliente,
  descripcion_solicitud: "Quiero algo para mi negocio pero no se que.",
};

describe("SolicitarLeadSchema", () => {
  it("ST10-U1: acepta una solicitud mínima válida (solo campos requeridos)", () => {
    const result = SolicitarLeadSchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  it("ST10-U2: acepta presupuesto y fecha opcionales", () => {
    const result = SolicitarLeadSchema.safeParse({
      ...validBase,
      presupuesto_aprox: 5000,
      fecha_requerida: "2026-12-01",
    });
    expect(result.success).toBe(true);
  });

  it("ST11-U1: acepta los tres tipos de solicitud", () => {
    for (const tipo of ["idea_nula", "idea_vaga", "personalizada"] as const) {
      expect(SolicitarLeadSchema.safeParse({ ...validBase, tipo_solicitud: tipo }).success).toBe(
        true
      );
    }
  });

  it("ST10-U3: rechaza un tipo_solicitud fuera del catálogo", () => {
    expect(
      SolicitarLeadSchema.safeParse({ ...validBase, tipo_solicitud: "otra_cosa" }).success
    ).toBe(false);
  });

  it("ST10-U4: rechaza descripción vacía", () => {
    expect(
      SolicitarLeadSchema.safeParse({ ...validBase, descripcion_solicitud: "   " }).success
    ).toBe(false);
  });

  it("ST10-U5: rechaza emojis en la descripción", () => {
    expect(
      SolicitarLeadSchema.safeParse({ ...validBase, descripcion_solicitud: "Quiero un logo 😀" })
        .success
    ).toBe(false);
  });

  it("ST10-U6: rechaza un correo inválido", () => {
    expect(
      SolicitarLeadSchema.safeParse({
        ...validBase,
        cliente: { ...baseCliente, correo_electronico: "ana@dominio" },
      }).success
    ).toBe(false);
  });

  it("ST12-U1: rechaza presupuesto negativo y presupuesto fuera de rango", () => {
    expect(SolicitarLeadSchema.safeParse({ ...validBase, presupuesto_aprox: -1 }).success).toBe(
      false
    );
    expect(
      SolicitarLeadSchema.safeParse({ ...validBase, presupuesto_aprox: 100000000 }).success
    ).toBe(false);
  });

  it("ST10-U7: rechaza una fecha requerida en el pasado", () => {
    expect(
      SolicitarLeadSchema.safeParse({ ...validBase, fecha_requerida: "2000-01-01" }).success
    ).toBe(false);
  });

  it("ST12-U2: acepta un id_servicio para personalización", () => {
    const result = SolicitarLeadSchema.safeParse({
      ...validBase,
      tipo_solicitud: "personalizada",
      id_servicio: 7,
    });
    expect(result.success).toBe(true);
  });
});
