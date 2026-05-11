/**
 * @jest-environment node
 */
import { prisma } from "@/lib/db/client";

import { createApp } from "../helpers/next-supertest";

jest.mock("@/lib/db/client", () => ({
  prisma: {
    pedidos: {
      findUnique: jest.fn(),
    },
  },
}));

const mockFindUnique = prisma.pedidos.findUnique as jest.Mock;

const mockGetSession = jest.fn();
jest.mock("@/lib/auth/session", () => ({
  getSession: () => mockGetSession(),
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeApp(routes: Record<string, any>) {
  return createApp(routes, (url) => {
    const segments = url.pathname.split("/");
    return { id: segments[segments.length - 1] };
  });
}

const BASE_PEDIDO = {
  id_pedido: 1,
  id_cliente: 2,
  id_estatus: 1,
  id_sucursal: null,
  fecha_creacion: new Date("2026-05-01T00:00:00Z"),
  fecha_estimada: null,
  fecha_fin: null,
  factura: false,
  facturado: false,
  numero_factura: null,
  notas: null,
  cliente: {
    id_cliente: 2,
    nombre_cliente: "Juan Pérez",
    empresa: null,
    rfc: null,
    correo_electronico: "juan@test.com",
    numero_telefono: "4421234567",
    categoria: null,
  },
  estatus: { id_estatus: 1, descripcion: "Cotizacion" },
  sucursal: null,
  detalles: [],
  pagos: [],
  historial: [],
};

// ─────────────────────────────────────────────────────────────────────────────
// PE-05 – GET /api/pedidos/[id]
// ─────────────────────────────────────────────────────────────────────────────
describe("GET /api/pedidos/[id] — PE-05 Consultar detalles de pedido", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let routes: any;

  beforeAll(async () => {
    routes = await import("@/app/api/pedidos/[id]/route");
  });

  beforeEach(() => jest.clearAllMocks());

  it("retorna 401 sin sesión activa", async () => {
    mockGetSession.mockResolvedValue(null);

    const res = await makeApp({ GET: routes.GET }).get("/api/pedidos/1");

    expect(res.status).toBe(401);
  });

  it("retorna 403 cuando el rol es Finanzas", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Finanzas" });

    const res = await makeApp({ GET: routes.GET }).get("/api/pedidos/1");

    expect(res.status).toBe(403);
  });

  it("retorna 422 cuando el id no es un número", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });

    const res = await makeApp({ GET: routes.GET }).get("/api/pedidos/abc");

    expect(res.status).toBe(422);
  });

  it("retorna 404 cuando el pedido no existe", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    mockFindUnique.mockResolvedValue(null);

    const res = await makeApp({ GET: routes.GET }).get("/api/pedidos/999");

    expect(res.status).toBe(404);
    expect(res.body.error).toContain("no encontrado");
  });

  it("retorna 200 con los datos del pedido para rol Direccion", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    mockFindUnique.mockResolvedValue(BASE_PEDIDO);

    const res = await makeApp({ GET: routes.GET }).get("/api/pedidos/1");

    expect(res.status).toBe(200);
    expect(res.body.data.id_pedido).toBe(1);
    expect(res.body.data.cliente.nombre_cliente).toBe("Juan Pérez");
    expect(res.body.data.estatus.descripcion).toBe("Cotizacion");
    expect(res.body.error).toBeNull();
  });

  it("retorna 200 con los datos del pedido para rol Colaborador", async () => {
    mockGetSession.mockResolvedValue({ id: 2, role: "Colaborador" });
    mockFindUnique.mockResolvedValue(BASE_PEDIDO);

    const res = await makeApp({ GET: routes.GET }).get("/api/pedidos/1");

    expect(res.status).toBe(200);
    expect(res.body.data.id_pedido).toBe(1);
  });

  it("retorna 200 con detalles, pagos e historial cuando existen", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    mockFindUnique.mockResolvedValue({
      ...BASE_PEDIDO,
      detalles: [
        {
          id_detalle: 10,
          cantidad: 2,
          ancho_cm: "30.00",
          alto_cm: "20.00",
          grosor_cm: null,
          color: "Rojo",
          precio_unitario: "500.00",
          subtotal: "1000.00",
          opciones_seleccionadas: {},
          notas: null,
          responsable_recoleccion: "Carlos",
          servicio: { nombre_servicio: "Rotulación" },
          material: { nombre_material: "Vinil adhesivo" },
          archivo: { url_archivo: "https://example.com/design.pdf", nombre_archivo: "design.pdf" },
        },
      ],
      pagos: [
        {
          id_pago: 5,
          fecha: new Date("2026-05-02T00:00:00Z"),
          monto_pago: "500.00",
          metodo_pago: "transferencia",
          estatus_pago: "Pagado",
          referencia_mercadopago: null,
        },
      ],
      historial: [
        {
          id_historial: 1,
          fecha_cambio: new Date("2026-05-01T10:00:00Z"),
          id_estatus_pedido: null,
          estadoAnterior: null,
          estadoNuevo: { descripcion: "Cotizacion" },
          usuario: { nombre_completo: "Admin Test" },
        },
      ],
    });

    const res = await makeApp({ GET: routes.GET }).get("/api/pedidos/1");

    expect(res.status).toBe(200);
    expect(res.body.data.detalles).toHaveLength(1);
    expect(res.body.data.detalles[0].servicio.nombre_servicio).toBe("Rotulación");
    expect(res.body.data.pagos).toHaveLength(1);
    expect(res.body.data.pagos[0].monto_pago).toBe("500.00");
    expect(res.body.data.historial).toHaveLength(1);
    expect(res.body.data.historial[0].estadoNuevo.descripcion).toBe("Cotizacion");
  });
});
