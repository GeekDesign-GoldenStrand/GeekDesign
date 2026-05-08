/**
 * @jest-environment node
 */
import { prisma } from "@/lib/db/client";

import { createApp } from "../helpers/next-supertest";

jest.mock("@/lib/db/client", () => ({
  prisma: {
    materiales: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

const mockFindMany = prisma.materiales.findMany as jest.Mock;
const mockCount = prisma.materiales.count as jest.Mock;
const mockFindUnique = prisma.materiales.findUnique as jest.Mock;
const mockCreate = prisma.materiales.create as jest.Mock;
const mockUpdate = prisma.materiales.update as jest.Mock;
const mockDelete = prisma.materiales.delete as jest.Mock;
const mockTransaction = prisma.$transaction as jest.Mock;

const mockGetSession = jest.fn();
jest.mock("@/lib/auth/session", () => ({
  getSession: () => mockGetSession(),
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeAppById(routes: Record<string, any>) {
  return createApp(routes, (url) => {
    const segments = url.pathname.split("/");
    return { id: segments[segments.length - 1] };
  });
}

const BASE_MATERIAL = {
  id_material: 1,
  nombre_material: "Acrílico espejo",
  descripcion_material: "Material de alta reflectividad",
  unidad_medida: "mm",
  ancho: 1200,
  alto: 2400,
  grosor: 3,
  color: "Plata",
  imagen_url: "https://example.com/acrilico.jpg",
};

const VALID_PAYLOAD = {
  nombre_material: "Acrílico espejo",
  descripcion_material: "Material de alta reflectividad",
  unidad_medida: "mm",
  ancho: 1200,
  alto: 2400,
  grosor: 3,
  color: "Plata",
  imagen_url: "https://example.com/acrilico.jpg",
};

// ──────────────────────────────────────────────────────────────────────────────
// MAT-01 – GET /api/materiales
// ──────────────────────────────────────────────────────────────────────────────
describe("GET /api/materiales — MAT-01 Listar materiales", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let routes: any;

  beforeAll(async () => {
    routes = await import("@/app/api/materiales/route");
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockTransaction.mockImplementation((ops: Promise<unknown>[]) => Promise.all(ops));
  });

  it("retorna 401 sin sesión activa", async () => {
    mockGetSession.mockResolvedValue(null);

    const res = await createApp({ GET: routes.GET }).get("/api/materiales");
    expect(res.status).toBe(401);
  });

  it("retorna 403 con rol no permitido (Finanzas)", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Finanzas" });

    const res = await createApp({ GET: routes.GET }).get("/api/materiales");
    expect(res.status).toBe(403);
  });

  it("retorna 200 con items y total (rol Colaborador)", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Colaborador" });
    mockFindMany.mockResolvedValue([BASE_MATERIAL]);
    mockCount.mockResolvedValue(1);

    const res = await createApp({ GET: routes.GET }).get("/api/materiales");
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.total).toBe(1);
  });

  it("retorna 200 con items y total (rol Administrador)", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Administrador" });
    mockFindMany.mockResolvedValue([BASE_MATERIAL]);
    mockCount.mockResolvedValue(1);

    const res = await createApp({ GET: routes.GET }).get("/api/materiales");
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it("retorna 200 con items y total (rol Direccion)", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    mockFindMany.mockResolvedValue([BASE_MATERIAL]);
    mockCount.mockResolvedValue(1);

    const res = await createApp({ GET: routes.GET }).get("/api/materiales");
    expect(res.status).toBe(200);
    expect(res.body.page).toBe(1);
    expect(res.body.pageSize).toBe(20);
  });

  it("pasa el parámetro ?sort=desc al servicio", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    await createApp({ GET: routes.GET }).get("/api/materiales?sort=desc");
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { nombre_material: "desc" } })
    );
  });

  it("pasa el parámetro ?q al servicio como filtro de búsqueda", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    await createApp({ GET: routes.GET }).get("/api/materiales?q=acrílico");
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ OR: expect.any(Array) }),
      })
    );
  });

  it("limita pageSize a 100 aunque se pida más", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    await createApp({ GET: routes.GET }).get("/api/materiales?pageSize=9999");
    expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({ take: 100 }));
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// MAT-02 – POST /api/materiales
// ──────────────────────────────────────────────────────────────────────────────
describe("POST /api/materiales — MAT-02 Registrar material", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let routes: any;

  beforeAll(async () => {
    routes = await import("@/app/api/materiales/route");
  });

  beforeEach(() => jest.clearAllMocks());

  it("retorna 401 sin sesión activa", async () => {
    mockGetSession.mockResolvedValue(null);

    const res = await createApp({ POST: routes.POST }).post("/api/materiales").send(VALID_PAYLOAD);
    expect(res.status).toBe(401);
  });

  it("retorna 403 con rol Colaborador", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Colaborador" });

    const res = await createApp({ POST: routes.POST }).post("/api/materiales").send(VALID_PAYLOAD);
    expect(res.status).toBe(403);
  });

  it("acepta rol Administrador como equivalente a Direccion", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Administrador" });
    mockCreate.mockResolvedValue(BASE_MATERIAL);

    const res = await createApp({ POST: routes.POST }).post("/api/materiales").send(VALID_PAYLOAD);
    expect(res.status).toBe(201);
  });

  it("retorna 201 con el material creado (rol Direccion)", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    mockCreate.mockResolvedValue(BASE_MATERIAL);

    const res = await createApp({ POST: routes.POST }).post("/api/materiales").send(VALID_PAYLOAD);
    expect(res.status).toBe(201);
    expect(res.body.data.nombre_material).toBe("Acrílico espejo");
  });

  it("retorna 422 cuando faltan campos requeridos", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });

    const res = await createApp({ POST: routes.POST })
      .post("/api/materiales")
      .send({ nombre_material: "Solo nombre" });
    expect(res.status).toBe(422);
  });

  it("retorna 422 cuando imagen_url no inicia con https://", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });

    const res = await createApp({ POST: routes.POST })
      .post("/api/materiales")
      .send({ ...VALID_PAYLOAD, imagen_url: "http://example.com/img.jpg" });
    expect(res.status).toBe(422);
    expect(res.body.error).toContain("imagen_url");
  });

  it("retorna 422 cuando unidad_medida no es un valor permitido", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });

    const res = await createApp({ POST: routes.POST })
      .post("/api/materiales")
      .send({ ...VALID_PAYLOAD, unidad_medida: "kg" });
    expect(res.status).toBe(422);
    expect(res.body.error).toContain("unidad_medida");
  });

  it("retorna 422 cuando ancho supera 8 dígitos enteros", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });

    const res = await createApp({ POST: routes.POST })
      .post("/api/materiales")
      .send({ ...VALID_PAYLOAD, ancho: 123456789 });
    expect(res.status).toBe(422);
    expect(res.body.error).toContain("ancho");
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// MAT-03 – GET /api/materiales/[id]
// ──────────────────────────────────────────────────────────────────────────────
describe("GET /api/materiales/[id] — MAT-03 Obtener material por ID", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let routes: any;

  beforeAll(async () => {
    routes = await import("@/app/api/materiales/[id]/route");
  });

  beforeEach(() => jest.clearAllMocks());

  it("retorna 401 sin sesión activa", async () => {
    mockGetSession.mockResolvedValue(null);

    const res = await makeAppById({ GET: routes.GET }).get("/api/materiales/1");
    expect(res.status).toBe(401);
  });

  it("retorna 403 con rol Finanzas", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Finanzas" });

    const res = await makeAppById({ GET: routes.GET }).get("/api/materiales/1");
    expect(res.status).toBe(403);
  });

  it("retorna 200 con los datos del material", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Colaborador" });
    mockFindUnique.mockResolvedValue(BASE_MATERIAL);

    const res = await makeAppById({ GET: routes.GET }).get("/api/materiales/1");
    expect(res.status).toBe(200);
    expect(res.body.data.id_material).toBe(1);
  });

  it("retorna 404 cuando el material no existe", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    mockFindUnique.mockResolvedValue(null);

    const res = await makeAppById({ GET: routes.GET }).get("/api/materiales/999");
    expect(res.status).toBe(404);
    expect(res.body.error).toContain("no encontrado");
  });

  it("retorna 422 cuando el id no es un número", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });

    const res = await makeAppById({ GET: routes.GET }).get("/api/materiales/abc");
    expect(res.status).toBe(422);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// MAT-04 – PUT /api/materiales/[id]
// ──────────────────────────────────────────────────────────────────────────────
describe("PUT /api/materiales/[id] — MAT-04 Modificar material", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let routes: any;

  beforeAll(async () => {
    routes = await import("@/app/api/materiales/[id]/route");
  });

  beforeEach(() => jest.clearAllMocks());

  it("retorna 401 sin sesión activa", async () => {
    mockGetSession.mockResolvedValue(null);

    const res = await makeAppById({ PUT: routes.PUT })
      .put("/api/materiales/1")
      .send({ nombre_material: "Nuevo nombre" });
    expect(res.status).toBe(401);
  });

  it("retorna 403 con rol Colaborador", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Colaborador" });

    const res = await makeAppById({ PUT: routes.PUT })
      .put("/api/materiales/1")
      .send({ nombre_material: "Nuevo nombre" });
    expect(res.status).toBe(403);
  });

  it("acepta rol Administrador como equivalente a Direccion", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Administrador" });
    mockUpdate.mockResolvedValue(BASE_MATERIAL);

    const res = await makeAppById({ PUT: routes.PUT })
      .put("/api/materiales/1")
      .send({ nombre_material: "Acrílico espejo" });
    expect(res.status).toBe(200);
  });

  it("retorna 200 con el material actualizado", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    const updated = { ...BASE_MATERIAL, nombre_material: "Acrílico opaco" };
    mockUpdate.mockResolvedValue(updated);

    const res = await makeAppById({ PUT: routes.PUT })
      .put("/api/materiales/1")
      .send({ nombre_material: "Acrílico opaco" });
    expect(res.status).toBe(200);
    expect(res.body.data.nombre_material).toBe("Acrílico opaco");
  });

  it("retorna 404 cuando el material no existe (P2025)", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    mockUpdate.mockRejectedValue(Object.assign(new Error("Record not found"), { code: "P2025" }));

    const res = await makeAppById({ PUT: routes.PUT })
      .put("/api/materiales/999")
      .send({ nombre_material: "No existe" });
    expect(res.status).toBe(404);
    expect(res.body.error).toContain("no encontrado");
  });

  it("retorna 422 cuando el id no es un número", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });

    const res = await makeAppById({ PUT: routes.PUT })
      .put("/api/materiales/abc")
      .send({ nombre_material: "Test" });
    expect(res.status).toBe(422);
  });

  it("retorna 422 cuando ancho supera 8 dígitos enteros", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });

    const res = await makeAppById({ PUT: routes.PUT })
      .put("/api/materiales/1")
      .send({ ancho: 123456789 });
    expect(res.status).toBe(422);
    expect(res.body.error).toContain("ancho");
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// MAT-05 – DELETE /api/materiales/[id]
// ──────────────────────────────────────────────────────────────────────────────
describe("DELETE /api/materiales/[id] — MAT-05 Eliminar material", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let routes: any;

  beforeAll(async () => {
    routes = await import("@/app/api/materiales/[id]/route");
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockTransaction.mockImplementation(async (fn: (tx: any) => Promise<void>) => fn(prisma));
  });

  it("retorna 401 sin sesión activa", async () => {
    mockGetSession.mockResolvedValue(null);

    const res = await makeAppById({ DELETE: routes.DELETE }).delete("/api/materiales/1");
    expect(res.status).toBe(401);
  });

  it("retorna 403 con rol Colaborador", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Colaborador" });

    const res = await makeAppById({ DELETE: routes.DELETE }).delete("/api/materiales/1");
    expect(res.status).toBe(403);
  });

  it("acepta rol Administrador como equivalente a Direccion", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Administrador" });
    mockFindUnique.mockResolvedValue({
      id_material: 1,
      opciones: [],
      detallesPedido: [],
      pedidoMaquinas: [],
    });
    mockDelete.mockResolvedValue(BASE_MATERIAL);

    const res = await makeAppById({ DELETE: routes.DELETE }).delete("/api/materiales/1");
    expect(res.status).toBe(204);
  });

  it("retorna 204 cuando el material se elimina correctamente", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    mockFindUnique.mockResolvedValue({
      id_material: 1,
      opciones: [],
      detallesPedido: [],
      pedidoMaquinas: [],
    });
    mockDelete.mockResolvedValue(BASE_MATERIAL);

    const res = await makeAppById({ DELETE: routes.DELETE }).delete("/api/materiales/1");
    expect(res.status).toBe(204);
  });

  it("retorna 404 cuando el material no existe", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    mockFindUnique.mockResolvedValue(null);

    const res = await makeAppById({ DELETE: routes.DELETE }).delete("/api/materiales/999");
    expect(res.status).toBe(404);
    expect(res.body.error).toContain("no encontrado");
  });

  it("retorna 409 cuando el material está asociado a opciones de producto", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    mockFindUnique.mockResolvedValue({
      id_material: 1,
      opciones: [{ id_opcion: 1 }],
      detallesPedido: [],
      pedidoMaquinas: [],
    });

    const res = await makeAppById({ DELETE: routes.DELETE }).delete("/api/materiales/1");
    expect(res.status).toBe(409);
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("retorna 409 cuando el material está referenciado en pedidos", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    mockFindUnique.mockResolvedValue({
      id_material: 1,
      opciones: [],
      detallesPedido: [{ id_detalle: 1 }],
      pedidoMaquinas: [],
    });

    const res = await makeAppById({ DELETE: routes.DELETE }).delete("/api/materiales/1");
    expect(res.status).toBe(409);
  });

  it("retorna 422 cuando el id no es un número", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });

    const res = await makeAppById({ DELETE: routes.DELETE }).delete("/api/materiales/abc");
    expect(res.status).toBe(422);
  });
});
