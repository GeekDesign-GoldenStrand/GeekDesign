/**
 * @jest-environment node
 */
import { prisma } from "@/lib/db/client";

import { createApp } from "../helpers/next-supertest";

jest.mock("@/lib/db/client", () => ({
  prisma: {
    $transaction: jest.fn(),
    usuarios: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock("@/lib/auth/password", () => ({
  hashPassword: jest.fn().mockResolvedValue("hashed_password"),
}));

const mockTransaction = prisma.$transaction as jest.Mock;
const mockFindUnique = prisma.usuarios.findUnique as jest.Mock;
const mockCreate = prisma.usuarios.create as jest.Mock;
const mockUpdate = prisma.usuarios.update as jest.Mock;
const mockFindMany = prisma.usuarios.findMany as jest.Mock;
const mockCount = prisma.usuarios.count as jest.Mock;

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

const BASE_COLABORADOR = {
  id_usuario: 1,
  nombre_completo: "Juan García",
  correo_electronico: "juan@example.com",
  id_rol: 2,
  estatus: "Activo",
  rol: { id_rol: 2, nombre_rol: "Colaborador" },
  colaborador: {
    id_colaborador: 1,
    edad: 28,
    sexo: "M",
    telefono: "5551234567",
    estatus_colaborador: "Activo",
    fecha_modificacion: new Date().toISOString(),
    sucursal: { id_sucursal: 1, nombre_sucursal: "Sucursal Norte" },
  },
};

const VALID_PAYLOAD = {
  nombre_completo: "María López",
  correo_electronico: "maria@example.com",
  contrasena_hash: "password123",
  id_rol: 2,
  id_sucursal: 1,
  edad: 25,
  sexo: "F",
  telefono: "5559876543",
  estatus: "Activo",
  estatus_colaborador: "Activo",
};

// ──────────────────────────────────────────────────────────────────────────────
// COL-01 — POST /api/colaboradores — Registrar colaborador
// ──────────────────────────────────────────────────────────────────────────────
describe("POST /api/colaboradores — COL-01 Registrar colaborador", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let routes: any;

  beforeAll(async () => {
    routes = await import("@/app/api/colaboradores/route");
  });

  beforeEach(() => jest.clearAllMocks());

  it("retorna 401 sin sesión activa", async () => {
    mockGetSession.mockResolvedValue(null);

    const res = await createApp({ POST: routes.POST })
      .post("/api/colaboradores")
      .send(VALID_PAYLOAD);
    expect(res.status).toBe(401);
  });

  it("retorna 403 con rol Colaborador", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Colaborador" });

    const res = await createApp({ POST: routes.POST })
      .post("/api/colaboradores")
      .send(VALID_PAYLOAD);
    expect(res.status).toBe(403);
  });

  it("retorna 403 con rol Finanzas", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Finanzas" });

    const res = await createApp({ POST: routes.POST })
      .post("/api/colaboradores")
      .send(VALID_PAYLOAD);
    expect(res.status).toBe(403);
  });

  it("retorna 201 con el colaborador creado (rol Direccion)", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    mockCreate.mockResolvedValue(BASE_COLABORADOR);

    const res = await createApp({ POST: routes.POST })
      .post("/api/colaboradores")
      .send(VALID_PAYLOAD);
    expect(res.status).toBe(201);
    expect(res.body.data.nombre_completo).toBe("Juan García");
  });

  it("retorna 422 cuando nombre_completo está vacío", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });

    const res = await createApp({ POST: routes.POST })
      .post("/api/colaboradores")
      .send({ ...VALID_PAYLOAD, nombre_completo: "" });
    expect(res.status).toBe(422);
  });

  it("retorna 422 cuando correo_electronico es inválido", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });

    const res = await createApp({ POST: routes.POST })
      .post("/api/colaboradores")
      .send({ ...VALID_PAYLOAD, correo_electronico: "no-es-correo" });
    expect(res.status).toBe(422);
  });

  it("retorna 422 cuando edad está fuera del rango permitido (< 16)", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });

    const res = await createApp({ POST: routes.POST })
      .post("/api/colaboradores")
      .send({ ...VALID_PAYLOAD, edad: 14 });
    expect(res.status).toBe(422);
  });

  it("retorna 422 cuando sexo no es M, F ni NA", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });

    const res = await createApp({ POST: routes.POST })
      .post("/api/colaboradores")
      .send({ ...VALID_PAYLOAD, sexo: "X" });
    expect(res.status).toBe(422);
  });

  it("retorna 422 cuando la contraseña tiene menos de 8 caracteres", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });

    const res = await createApp({ POST: routes.POST })
      .post("/api/colaboradores")
      .send({ ...VALID_PAYLOAD, contrasena_hash: "short" });
    expect(res.status).toBe(422);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// COL-02 — GET /api/colaboradores — Consultar colaboradores
// ──────────────────────────────────────────────────────────────────────────────
describe("GET /api/colaboradores — COL-02 Consultar colaboradores", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let routes: any;

  beforeAll(async () => {
    routes = await import("@/app/api/colaboradores/route");
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockTransaction.mockImplementation((ops: Promise<unknown>[]) => Promise.all(ops));
  });

  it("retorna 401 sin sesión activa", async () => {
    mockGetSession.mockResolvedValue(null);

    const res = await createApp({ GET: routes.GET }).get("/api/colaboradores");
    expect(res.status).toBe(401);
  });

  it("retorna 403 con rol Colaborador", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Colaborador" });

    const res = await createApp({ GET: routes.GET }).get("/api/colaboradores");
    expect(res.status).toBe(403);
  });

  it("retorna 200 con lista vacía si no hay colaboradores", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    const res = await createApp({ GET: routes.GET }).get("/api/colaboradores");
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.total).toBe(0);
  });

  it("retorna 200 con los colaboradores y metadatos de paginación", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    mockFindMany.mockResolvedValue([BASE_COLABORADOR]);
    mockCount.mockResolvedValue(1);

    const res = await createApp({ GET: routes.GET }).get("/api/colaboradores");
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.page).toBe(1);
    expect(res.body.pageSize).toBe(20);
    expect(res.body.total).toBe(1);
  });

  it("respeta la paginación con parámetros page y pageSize", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    mockFindMany.mockResolvedValue([BASE_COLABORADOR, BASE_COLABORADOR]);
    mockCount.mockResolvedValue(10);

    const res = await createApp({ GET: routes.GET }).get("/api/colaboradores?page=2&pageSize=2");
    expect(res.status).toBe(200);
    expect(res.body.page).toBe(2);
    expect(res.body.pageSize).toBe(2);
    expect(res.body.total).toBe(10);
  });

  it("limita pageSize a 100 aunque se pida más", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    const res = await createApp({ GET: routes.GET }).get("/api/colaboradores?pageSize=9999");
    expect(res.status).toBe(200);
    expect(res.body.pageSize).toBe(100);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// COL-02 — GET /api/colaboradores/[id] — Obtener por ID
// ──────────────────────────────────────────────────────────────────────────────
describe("GET /api/colaboradores/[id] — COL-02 Consultar colaborador por ID", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let routes: any;

  beforeAll(async () => {
    routes = await import("@/app/api/colaboradores/[id]/route");
  });

  beforeEach(() => jest.clearAllMocks());

  it("retorna 401 sin sesión activa", async () => {
    mockGetSession.mockResolvedValue(null);

    const res = await makeAppById({ GET: routes.GET }).get("/api/colaboradores/1");
    expect(res.status).toBe(401);
  });

  it("retorna 403 con rol Finanzas", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Finanzas" });

    const res = await makeAppById({ GET: routes.GET }).get("/api/colaboradores/1");
    expect(res.status).toBe(403);
  });

  it("retorna 200 con los datos del colaborador", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    mockFindUnique.mockResolvedValue(BASE_COLABORADOR);

    const res = await makeAppById({ GET: routes.GET }).get("/api/colaboradores/1");
    expect(res.status).toBe(200);
    expect(res.body.data.id_usuario).toBe(1);
    expect(res.body.data.colaborador).toBeDefined();
  });

  it("retorna 404 cuando el colaborador no existe", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    mockFindUnique.mockResolvedValue(null);

    const res = await makeAppById({ GET: routes.GET }).get("/api/colaboradores/999");
    expect(res.status).toBe(404);
    expect(res.body.error).toContain("no encontrado");
  });

  it("retorna 422 cuando el id no es un número", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });

    const res = await makeAppById({ GET: routes.GET }).get("/api/colaboradores/abc");
    expect(res.status).toBe(422);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// COL-03 — PUT /api/colaboradores/[id] — Modificar información
// ──────────────────────────────────────────────────────────────────────────────
describe("PUT /api/colaboradores/[id] — COL-03 Modificar información", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let routes: any;

  beforeAll(async () => {
    routes = await import("@/app/api/colaboradores/[id]/route");
  });

  beforeEach(() => jest.clearAllMocks());

  it("retorna 401 sin sesión activa", async () => {
    mockGetSession.mockResolvedValue(null);

    const res = await makeAppById({ PUT: routes.PUT })
      .put("/api/colaboradores/1")
      .send({ nombre_completo: "Nuevo nombre" });
    expect(res.status).toBe(401);
  });

  it("retorna 403 con rol Colaborador", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Colaborador" });

    const res = await makeAppById({ PUT: routes.PUT })
      .put("/api/colaboradores/1")
      .send({ nombre_completo: "Nuevo nombre" });
    expect(res.status).toBe(403);
  });

  it("retorna 200 con el colaborador actualizado (nombre_completo)", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    const updated = { ...BASE_COLABORADOR, nombre_completo: "Nombre Actualizado" };
    mockUpdate.mockResolvedValue(updated);

    const res = await makeAppById({ PUT: routes.PUT })
      .put("/api/colaboradores/1")
      .send({ nombre_completo: "Nombre Actualizado" });
    expect(res.status).toBe(200);
    expect(res.body.data.nombre_completo).toBe("Nombre Actualizado");
  });

  it("retorna 200 al actualizar estatus_colaborador (Inactivo)", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    const updated = {
      ...BASE_COLABORADOR,
      colaborador: { ...BASE_COLABORADOR.colaborador, estatus_colaborador: "Inactivo" },
    };
    mockUpdate.mockResolvedValue(updated);

    const res = await makeAppById({ PUT: routes.PUT })
      .put("/api/colaboradores/1")
      .send({ estatus_colaborador: "Inactivo" });
    expect(res.status).toBe(200);
    expect(res.body.data.colaborador.estatus_colaborador).toBe("Inactivo");
  });

  it("retorna 200 al actualizar campos anidados (telefono, edad, sucursal)", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    mockUpdate.mockResolvedValue(BASE_COLABORADOR);

    const res = await makeAppById({ PUT: routes.PUT })
      .put("/api/colaboradores/1")
      .send({ telefono: "5550001111", edad: 30, id_sucursal: 2 });
    expect(res.status).toBe(200);
  });

  it("retorna 404 cuando el colaborador no existe (P2025)", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    mockUpdate.mockRejectedValue(Object.assign(new Error("Record not found"), { code: "P2025" }));

    const res = await makeAppById({ PUT: routes.PUT })
      .put("/api/colaboradores/999")
      .send({ nombre_completo: "No existe" });
    expect(res.status).toBe(404);
    expect(res.body.error).toContain("no encontrado");
  });

  it("retorna 422 cuando el id no es un número", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });

    const res = await makeAppById({ PUT: routes.PUT })
      .put("/api/colaboradores/abc")
      .send({ nombre_completo: "Test" });
    expect(res.status).toBe(422);
  });

  it("retorna 422 cuando correo_electronico tiene formato inválido", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });

    const res = await makeAppById({ PUT: routes.PUT })
      .put("/api/colaboradores/1")
      .send({ correo_electronico: "invalido" });
    expect(res.status).toBe(422);
  });

  it("retorna 422 cuando edad está fuera de rango (> 100)", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });

    const res = await makeAppById({ PUT: routes.PUT })
      .put("/api/colaboradores/1")
      .send({ edad: 150 });
    expect(res.status).toBe(422);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// COL-04 — DELETE /api/colaboradores/[id] — Eliminar colaborador
// ──────────────────────────────────────────────────────────────────────────────
describe("DELETE /api/colaboradores/[id] — COL-04 Eliminar colaborador", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let routes: any;

  beforeAll(async () => {
    routes = await import("@/app/api/colaboradores/[id]/route");
  });

  beforeEach(() => jest.clearAllMocks());

  it("retorna 401 sin sesión activa", async () => {
    mockGetSession.mockResolvedValue(null);

    const res = await makeAppById({ DELETE: routes.DELETE }).delete("/api/colaboradores/1");
    expect(res.status).toBe(401);
  });

  it("retorna 403 con rol Colaborador", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Colaborador" });

    const res = await makeAppById({ DELETE: routes.DELETE }).delete("/api/colaboradores/1");
    expect(res.status).toBe(403);
  });

  it("retorna 403 con rol Finanzas", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Finanzas" });

    const res = await makeAppById({ DELETE: routes.DELETE }).delete("/api/colaboradores/1");
    expect(res.status).toBe(403);
  });

  it("retorna 204 cuando el colaborador se elimina correctamente (soft delete)", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    mockUpdate.mockResolvedValue(undefined);

    const res = await makeAppById({ DELETE: routes.DELETE }).delete("/api/colaboradores/1");
    expect(res.status).toBe(204);
  });

  it("llama update con estatus Inactivo en lugar de delete", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    mockUpdate.mockResolvedValue(undefined);

    await makeAppById({ DELETE: routes.DELETE }).delete("/api/colaboradores/1");
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ estatus: "Inactivo" }),
      })
    );
  });

  it("retorna 404 cuando el colaborador no existe (P2025)", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    mockUpdate.mockRejectedValue(Object.assign(new Error("Record not found"), { code: "P2025" }));

    const res = await makeAppById({ DELETE: routes.DELETE }).delete("/api/colaboradores/999");
    expect(res.status).toBe(404);
    expect(res.body.error).toContain("no encontrado");
  });

  it("retorna 422 cuando el id no es un número", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });

    const res = await makeAppById({ DELETE: routes.DELETE }).delete("/api/colaboradores/abc");
    expect(res.status).toBe(422);
  });
});
