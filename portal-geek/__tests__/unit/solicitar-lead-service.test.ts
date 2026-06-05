/**
 * @jest-environment node
 *
 * ST-10/11/12 — solicitarLead service. A lead is persisted as a Cotización with
 * id_pedido = null, monto_total = 0, the tipo_solicitud discriminator and a
 * Cliente-actor history row. No Pedido/Detalle is created.
 */
import { prisma } from "@/lib/db/client";
import type { SolicitarLeadInput } from "@/lib/schemas/cotizaciones";
import { solicitarLead } from "@/lib/services/cotizaciones";
import { ValidationError } from "@/lib/utils/errors";

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

const mockUpsert = prisma.clientes.upsert as jest.Mock;
const mockEstatus = prisma.estatusCotizacion.findUnique as jest.Mock;
const mockQueryRaw = prisma.$queryRaw as jest.Mock;
const mockCreateCot = prisma.cotizaciones.create as jest.Mock;
const mockCreateHist = prisma.historialEstadosCotizacion.create as jest.Mock;
const mockFindServicio = prisma.servicios.findUnique as jest.Mock;

const input: SolicitarLeadInput = {
  tipo_solicitud: "idea_nula",
  cliente: {
    nombre_cliente: "Ana Cliente",
    correo_electronico: "Ana@Example.com",
    numero_telefono: "+524421234567",
  },
  descripcion_solicitud: "No se que quiero, ayudenme.",
  presupuesto_aprox: 5000,
};

describe("solicitarLead", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpsert.mockResolvedValue({ id_cliente: 42 });
    mockEstatus.mockResolvedValue({ id_estatus: 1 });
    mockQueryRaw.mockResolvedValue([{ nextval: BigInt(7) }]);
    mockCreateCot.mockResolvedValue({ id_cotizacion: 99 });
    mockCreateHist.mockResolvedValue({});
  });

  it("ST10-U8: crea una cotización lead (id_pedido null, monto_total 0) y devuelve folio", async () => {
    const result = await solicitarLead(input);

    expect(result.id_cotizacion).toBe(99);
    expect(result.folio).toBe(`GD-${new Date().getFullYear()}-00007`);

    const createArg = mockCreateCot.mock.calls[0][0].data;
    expect(createArg).toMatchObject({
      id_cliente: 42,
      id_pedido: null,
      monto_total: 0,
      tipo_solicitud: "idea_nula",
      descripcion_solicitud: "No se que quiero, ayudenme.",
      presupuesto_aprox: 5000,
    });
  });

  it("ST10-U9: el upsert de Cliente no sobreescribe PII (update vacío)", async () => {
    await solicitarLead(input);
    const upsertArg = mockUpsert.mock.calls[0][0];
    expect(upsertArg.update).toEqual({});
    // correo normalizado a minúsculas antes del lookup/creación.
    expect(upsertArg.where.correo_electronico).toBe("ana@example.com");
  });

  it("ST10-U10: registra historial con actor_tipo 'Cliente'", async () => {
    await solicitarLead(input);
    expect(mockCreateHist).toHaveBeenCalledTimes(1);
    expect(mockCreateHist.mock.calls[0][0].data).toMatchObject({
      id_cotizacion: 99,
      id_cliente: 42,
      id_estado_anterior: null,
      actor_tipo: "Cliente",
    });
  });

  it("ST12-U3: rechaza un id_servicio inexistente con ValidationError", async () => {
    mockFindServicio.mockResolvedValue(null);
    await expect(
      solicitarLead({ ...input, tipo_solicitud: "personalizada", id_servicio: 123 })
    ).rejects.toBeInstanceOf(ValidationError);
    expect(mockCreateCot).not.toHaveBeenCalled();
  });

  it("ST12-U4: rechaza un servicio inactivo con ValidationError", async () => {
    mockFindServicio.mockResolvedValue({ id_servicio: 5, estatus_servicio: false });
    await expect(
      solicitarLead({ ...input, tipo_solicitud: "personalizada", id_servicio: 5 })
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
