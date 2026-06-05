import type { NextRequest } from "next/server";

import { GET } from "@/app/api/pedidos/[id]/route";
import { getPedido } from "@/lib/services/pedidos";
import { NotFoundError } from "@/lib/utils/errors";

// Mock auth guard: pass the handler through (the route owns its try/catch).
jest.mock("@/lib/auth/guards", () => ({
  withSectionParams: (_section: string, _action: string, handler: unknown) => handler,
  withRoleParams: (_roles: string[], handler: unknown) => handler,
}));

// Mock service layer
jest.mock("@/lib/services/pedidos", () => ({
  getPedido: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

const req = {} as unknown as NextRequest;
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

describe("GET /api/pedidos/[id] (PE-05 / PR-08)", () => {
  it("returns 200 with the order detail payload", async () => {
    (getPedido as jest.Mock).mockResolvedValue({
      pedido: { id_pedido: 7 },
      detalle: [],
      pagos: [],
      historial: [],
      hasTerceros: false,
    });

    const res = await GET(req, ctx("7"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(getPedido).toHaveBeenCalledWith(7);
    expect(body.data.pedido.id_pedido).toBe(7);
    expect(body.data.detalle).toEqual([]);
    expect(body.data.pagos).toEqual([]);
    expect(body.data.historial).toEqual([]);
    expect(body.data.hasTerceros).toBe(false);
  });

  it("returns assigned machine information in each order detail line", async () => {
    const fechaAsignacion = new Date("2026-04-24T00:00:00.000Z");

    (getPedido as jest.Mock).mockResolvedValue({
      pedido: { id_pedido: 8 },
      detalle: [
        {
          id_detalle: 101,
          id_pedido: 8,
          id_servicio: 1,
          id_material: 1,
          id_archivo: 1,
          id_estatus: null,
          id_usuario_modificacion: null,
          fecha_modificacion: null,
          cantidad: 4,
          responsable_recoleccion: "Cliente Demo",
          notas: "Detalle demo",
          precio_unitario: "250.00",
          subtotal: "1000.00",
          servicio: {
            nombre_servicio: "Corte Láser",
          },
          material: {
            nombre_material: "MDF 3mm",
          },
          archivo: {
            id_archivo: 1,
            nombre_archivo: "__PLACEHOLDER__",
            url_archivo: "https://placeholder.invalid/no-design-yet",
            formato: "n/a",
          },
          estatus: {
            id_estatus: 4,
            descripcion: "Entregado",
          },
          variablesCotizacion: [],
          maquinaAsignada: {
            id_maquina: 1,
            nombre_maquina: "Láser CO2 100W",
            apodo_maquina: "Láser Grande",
            tipo: "Láser CO2",
            fecha_asignacion: fechaAsignacion,
            material: {
              id_material: 1,
              nombre_material: "MDF 3mm",
            },
          },
        },
      ],
      pagos: [],
      historial: [],
      hasTerceros: false,
    });

    const res = await GET(req, ctx("8"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(getPedido).toHaveBeenCalledWith(8);

    expect(body.data.detalle).toHaveLength(1);
    expect(body.data.detalle[0].maquinaAsignada).toMatchObject({
      id_maquina: 1,
      nombre_maquina: "Láser CO2 100W",
      apodo_maquina: "Láser Grande",
      tipo: "Láser CO2",
      material: {
        id_material: 1,
        nombre_material: "MDF 3mm",
      },
    });
  });

  it("returns null assigned machine when the detail line has no assigned machine", async () => {
    (getPedido as jest.Mock).mockResolvedValue({
      pedido: { id_pedido: 8 },
      detalle: [
        {
          id_detalle: 102,
          id_pedido: 8,
          id_servicio: 4,
          id_material: 4,
          id_archivo: 1,
          id_estatus: null,
          id_usuario_modificacion: null,
          fecha_modificacion: null,
          cantidad: 3,
          responsable_recoleccion: "Cliente Demo",
          notas: "Detalle demo",
          precio_unitario: "625.00",
          subtotal: "1875.00",
          servicio: {
            nombre_servicio: "Rotulación de vinil",
          },
          material: {
            nombre_material: "Vinil adhesivo",
          },
          archivo: {
            id_archivo: 1,
            nombre_archivo: "__PLACEHOLDER__",
            url_archivo: "https://placeholder.invalid/no-design-yet",
            formato: "n/a",
          },
          estatus: {
            id_estatus: 3,
            descripcion: "Finalizado",
          },
          variablesCotizacion: [],
          maquinaAsignada: null,
        },
      ],
      pagos: [],
      historial: [],
      hasTerceros: false,
    });

    const res = await GET(req, ctx("8"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(getPedido).toHaveBeenCalledWith(8);

    expect(body.data.detalle).toHaveLength(1);
    expect(body.data.detalle[0].maquinaAsignada).toBeNull();
  });

  it("returns 404 when the order does not exist", async () => {
    (getPedido as jest.Mock).mockRejectedValue(new NotFoundError("Pedido no encontrado"));

    const res = await GET(req, ctx("999"));

    expect(res.status).toBe(404);
  });

  it("returns 422 for a non-numeric id", async () => {
    const res = await GET(req, ctx("abc"));

    expect(res.status).toBe(422);
    expect(getPedido).not.toHaveBeenCalled();
  });
});
