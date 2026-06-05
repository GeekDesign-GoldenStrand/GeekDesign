/**
 * @jest-environment node
 *
 * ST-10/11/12 — POST /api/storefront/cotizaciones/lead.
 * Public endpoint: Zod-validates, persists a lead Cotización, returns the folio.
 */
import { prisma } from "@/lib/db/client";

import { createApp } from "../helpers/next-supertest";

jest.mock("@/lib/db/client", () => ({
  prisma: {
    $transaction: jest.fn((cb) => cb(prisma)),
    $queryRaw: jest.fn(),
    servicios: { findUnique: jest.fn() },
    clientes: { upsert: jest.fn() },
    estatusCotizacion: { findUnique: jest.fn() },
    cotizaciones: { create: jest.fn() },
    historialEstadosCotizacion: { create: jest.fn() },
  },
}));

const validBody = {
  tipo_solicitud: "idea_nula",
  cliente: {
    nombre_cliente: "Ana Cliente",
    correo_electronico: "ana@example.com",
    numero_telefono: "+524421234567",
  },
  descripcion_solicitud: "No se que quiero, ayudenme.",
  presupuesto_aprox: 5000,
};

async function appForPost() {
  const routes = await import("@/app/api/storefront/cotizaciones/lead/route");
  return createApp({ POST: routes.POST });
}

describe("POST /api/storefront/cotizaciones/lead", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.clientes.upsert as jest.Mock).mockResolvedValue({ id_cliente: 1 });
    (prisma.estatusCotizacion.findUnique as jest.Mock).mockResolvedValue({ id_estatus: 1 });
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ nextval: BigInt(1) }]);
    (prisma.cotizaciones.create as jest.Mock).mockResolvedValue({ id_cotizacion: 1 });
    (prisma.historialEstadosCotizacion.create as jest.Mock).mockResolvedValue({});
  });

  it("ST10-I1: 201 con folio para una solicitud válida", async () => {
    const app = await appForPost();
    const res = await app.post("/").send(validBody);

    expect(res.status).toBe(201);
    expect(res.body.data.folio).toBe(`GD-${new Date().getFullYear()}-00001`);
    expect(res.body.error).toBeNull();
  });

  it("ST10-I2: 422 cuando falta el tipo_solicitud", async () => {
    const app = await appForPost();
    const { tipo_solicitud: _omit, ...sinTipo } = validBody;
    const res = await app.post("/").send(sinTipo);

    expect(res.status).toBe(422);
    expect(prisma.cotizaciones.create).not.toHaveBeenCalled();
  });

  it("ST10-I3: 422 con un correo inválido", async () => {
    const app = await appForPost();
    const res = await app
      .post("/")
      .send({ ...validBody, cliente: { ...validBody.cliente, correo_electronico: "ana@dominio" } });

    expect(res.status).toBe(422);
  });
});
