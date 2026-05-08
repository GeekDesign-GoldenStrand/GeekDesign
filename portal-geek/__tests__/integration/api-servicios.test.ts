/**
 * @jest-environment node
 */
import { prisma } from "@/lib/db/client";

import { createApp } from "../helpers/next-supertest";

jest.mock("@/lib/db/client", () => ({
  prisma: {
    servicios: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}));

const mockFindMany = prisma.servicios.findMany as jest.Mock;
const mockCount = prisma.servicios.count as jest.Mock;
const mockFindFirst = prisma.servicios.findFirst as jest.Mock;

const mockGetSession = jest.fn();
jest.mock("@/lib/auth/session", () => ({
  getSession: () => mockGetSession(),
}));

describe("GET /api/servicios", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let routes: any;

  beforeAll(async () => {
    routes = await import("@/app/api/servicios/route");
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("retorna 200 con lista paginada cuando activo=true (ruta pública)", async () => {
    mockFindMany.mockResolvedValue([
      { id_servicio: 1, nombre_servicio: "Corte Láser", estatus_servicio: true },
    ]);
    mockCount.mockResolvedValue(1);

    const res = await createApp({ GET: routes.GET }).get("/api/servicios?activo=true");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.total).toBe(1);
    expect(res.body.page).toBe(1);
  });

  it("respeta parámetros de paginación", async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    const res = await createApp({ GET: routes.GET }).get(
      "/api/servicios?activo=true&page=2&pageSize=5"
    );

    expect(res.status).toBe(200);
    expect(res.body.page).toBe(2);
    expect(res.body.pageSize).toBe(5);
  });

  it("retorna 401 sin sesión cuando se pide lista completa (admin-only)", async () => {
    mockGetSession.mockResolvedValue(null);

    const res = await createApp({ GET: routes.GET }).get("/api/servicios");

    expect(res.status).toBe(401);
  });

  it("retorna 403 cuando un Colaborador pide lista completa", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Colaborador" });

    const res = await createApp({ GET: routes.GET }).get("/api/servicios");

    expect(res.status).toBe(403);
  });

  it("retorna 200 cuando un Administrador pide lista completa", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Administrador" });
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    const res = await createApp({ GET: routes.GET }).get("/api/servicios");

    expect(res.status).toBe(200);
  });
});

describe("GET /api/servicios/[id]", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let routes: any;

  beforeAll(async () => {
    routes = await import("@/app/api/servicios/[id]/route");
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function detailApp() {
    return createApp({ GET: routes.GET }, (url) => {
      const segments = url.pathname.split("/");
      return { id: segments[segments.length - 1] };
    });
  }

  it("retorna 200 con detalle del servicio (ruta pública)", async () => {
    mockFindFirst.mockResolvedValue({
      id_servicio: 1,
      nombre_servicio: "Corte Láser",
      opciones: [
        {
          material: { id_material: 1 },
          valores: [{ es_default: true, matriz: [{ precio_unitario: 100 }] }],
        },
      ],
    });

    const res = await detailApp().get("/api/servicios/1");

    expect(res.status).toBe(200);
    expect(res.body.data.servicio.id_servicio).toBe(1);
    expect(res.body.data.precioBase).toBe(100);
  });

  it("retorna 404 cuando el servicio no existe", async () => {
    mockFindFirst.mockResolvedValue(null);

    const res = await detailApp().get("/api/servicios/999");

    expect(res.status).toBe(404);
    expect(res.body.error).toContain("no encontrado");
  });

  it("retorna 422 cuando el id no es un número válido", async () => {
    const res = await detailApp().get("/api/servicios/abc");

    expect(res.status).toBe(422);
  });
});

describe("POST /api/servicios", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let routes: any;

  beforeAll(async () => {
    routes = await import("@/app/api/servicios/route");
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("retorna 401 sin sesión", async () => {
    mockGetSession.mockResolvedValue(null);

    const res = await createApp({ POST: routes.POST })
      .post("/api/servicios")
      .send({ nombre_servicio: "Test", id_estatus: 1 });

    expect(res.status).toBe(401);
  });

  it("retorna 422 cuando el body no tiene nombre_servicio", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Administrador" });

    const res = await createApp({ POST: routes.POST })
      .post("/api/servicios")
      .send({ descripcion_servicio: "Sin nombre" });

    expect(res.status).toBe(422);
    expect(res.body.error).toContain("nombre_servicio");
  });

  it("retorna 422 cuando falta id_estatus", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Administrador" });

    const res = await createApp({ POST: routes.POST })
      .post("/api/servicios")
      .send({ nombre_servicio: "Corte Láser" });

    expect(res.status).toBe(422);
    expect(res.body.error).toContain("id_estatus");
  });
});
