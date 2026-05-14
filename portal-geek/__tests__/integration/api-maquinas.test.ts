/**
 * @jest-environment node
 */
import { prisma } from "@/lib/db/client";

import { createApp } from "../helpers/next-supertest";

jest.mock("@/lib/db/client", () => ({
  prisma: {
    $transaction: jest.fn(),
    maquinas: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    sucursalesMaquina: {
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
  },
}));

const mockTransaction = prisma.$transaction as jest.Mock;
const mockFindMany = prisma.maquinas.findMany as jest.Mock;
const mockCount = prisma.maquinas.count as jest.Mock;
const mockFindUnique = prisma.maquinas.findUnique as jest.Mock;
const mockCreate = prisma.maquinas.create as jest.Mock;
const mockUpdate = prisma.maquinas.update as jest.Mock;
const mockSucursalFindFirst = prisma.sucursalesMaquina.findFirst as jest.Mock;
const mockSucursalUpdate = prisma.sucursalesMaquina.update as jest.Mock;
const mockSucursalCreate = prisma.sucursalesMaquina.create as jest.Mock;

const mockGetSession = jest.fn();
jest.mock("@/lib/auth/session", () => ({
  getSession: () => mockGetSession(),
}));

const VALID_PAYLOAD = {
  nombre_maquina: "CO2 100 Watts",
  apodo_maquina: "Cardenal",
  tipo: "Láser CO2",
  descripcion: "Área de trabajo 60x90cm",
};

const CREATED_MAQUINA = {
  id_maquina: 1,
  nombre_maquina: "CO2 100 Watts",
  apodo_maquina: "Cardenal",
  tipo: "Láser CO2",
  descripcion: "Área de trabajo 60x90cm",
  estatus: "Activa",
  fecha_registro: new Date().toISOString(),
  sucursales: [{ sucursal: { nombre_sucursal: "Sucursal Norte" } }],
  servicios: [{ servicio: { nombre_servicio: "Corte Láser" } }],
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeAppWithId(method: "GET" | "PUT" | "DELETE", routes: Record<string, any>) {
  return createApp(routes, (url) => {
    const segments = url.pathname.split("/");
    return { id: segments[segments.length - 1] };
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeAppWithSucursalId(routes: Record<string, any>) {
  return createApp(routes, (url) => {
    const segments = url.pathname.split("/");
    // Path format: /api/maquinas/1/sucursales
    return { id: segments[segments.length - 2] };
  });
}

// ---------------------------------------------------------------------------
// GET /api/maquinas — Ver Máquinas
// ---------------------------------------------------------------------------
describe("GET /api/maquinas — Ver Máquinas", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let routes: any;

  beforeAll(async () => {
    routes = await import("@/app/api/maquinas/route");
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockTransaction.mockImplementation((ops: Promise<unknown>[]) => Promise.all(ops));
  });

  it("retorna 401 sin sesión activa", async () => {
    mockGetSession.mockResolvedValue(null);

    const res = await createApp({ GET: routes.GET }).get("/api/maquinas");
    expect(res.status).toBe(401);
  });

  it("retorna 403 cuando el rol es Colaborador", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Colaborador" });

    const res = await createApp({ GET: routes.GET }).get("/api/maquinas");
    expect(res.status).toBe(403);
  });

  it("retorna 403 cuando el rol es Finanzas", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Finanzas" });

    const res = await createApp({ GET: routes.GET }).get("/api/maquinas");
    expect(res.status).toBe(403);
  });

  it("retorna 200 con lista vacía si no hay máquinas", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    const res = await createApp({ GET: routes.GET }).get("/api/maquinas");
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.total).toBe(0);
  });

  it("retorna 200 con lista de máquinas cuando el rol es Direccion", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    mockFindMany.mockResolvedValue([CREATED_MAQUINA]);
    mockCount.mockResolvedValue(1);

    const res = await createApp({ GET: routes.GET }).get("/api/maquinas");
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.total).toBe(1);
  });

  it("respeta los parámetros de paginación", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    const res = await createApp({ GET: routes.GET }).get("/api/maquinas?page=2&pageSize=5");
    expect(res.status).toBe(200);
    expect(res.body.page).toBe(2);
    expect(res.body.pageSize).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// POST /api/maquinas — Registrar Máquina
// ---------------------------------------------------------------------------
describe("POST /api/maquinas — Registrar Máquina", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let routes: any;

  beforeAll(async () => {
    routes = await import("@/app/api/maquinas/route");
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("retorna 401 sin sesión activa", async () => {
    mockGetSession.mockResolvedValue(null);

    const res = await createApp({ POST: routes.POST }).post("/api/maquinas").send(VALID_PAYLOAD);
    expect(res.status).toBe(401);
  });

  it("retorna 403 cuando el rol es Colaborador", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Colaborador" });

    const res = await createApp({ POST: routes.POST }).post("/api/maquinas").send(VALID_PAYLOAD);
    expect(res.status).toBe(403);
  });

  it("retorna 201 con la máquina creada cuando el rol es Direccion", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    mockCreate.mockResolvedValue(CREATED_MAQUINA);

    const res = await createApp({ POST: routes.POST }).post("/api/maquinas").send(VALID_PAYLOAD);

    expect(res.status).toBe(201);
    expect(res.body.data.id_maquina).toBe(1);
    expect(res.body.data.nombre_maquina).toBe("CO2 100 Watts");
    expect(res.body.error).toBeNull();
  });

  it("retorna 201 cuando el rol es Administrador", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Administrador" });
    mockCreate.mockResolvedValue(CREATED_MAQUINA);

    const res = await createApp({ POST: routes.POST }).post("/api/maquinas").send(VALID_PAYLOAD);
    expect(res.status).toBe(201);
  });

  it("asigna estatus Activa por defecto", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    mockCreate.mockResolvedValue(CREATED_MAQUINA);

    await createApp({ POST: routes.POST }).post("/api/maquinas").send(VALID_PAYLOAD);

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ estatus: "Activa" }),
      })
    );
  });

  it("retorna 422 cuando falta nombre_maquina", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    const { nombre_maquina: _nombre, ...rest } = VALID_PAYLOAD;

    const res = await createApp({ POST: routes.POST }).post("/api/maquinas").send(rest);
    expect(res.status).toBe(422);
  });

  it("retorna 422 cuando falta apodo_maquina", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    const { apodo_maquina: _apodo, ...rest } = VALID_PAYLOAD;

    const res = await createApp({ POST: routes.POST }).post("/api/maquinas").send(rest);
    expect(res.status).toBe(422);
  });

  it("retorna 422 cuando falta tipo", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    const { tipo: _tipo, ...rest } = VALID_PAYLOAD;

    const res = await createApp({ POST: routes.POST }).post("/api/maquinas").send(rest);
    expect(res.status).toBe(422);
  });

  it("retorna 422 cuando tipo no es un valor permitido", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });

    const res = await createApp({ POST: routes.POST })
      .post("/api/maquinas")
      .send({ ...VALID_PAYLOAD, tipo: "Tipo inválido" });
    expect(res.status).toBe(422);
    expect(res.body.error).toContain("tipo");
  });

  it("retorna 422 cuando nombre_maquina excede 100 caracteres", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });

    const res = await createApp({ POST: routes.POST })
      .post("/api/maquinas")
      .send({ ...VALID_PAYLOAD, nombre_maquina: "A".repeat(101) });
    expect(res.status).toBe(422);
  });

  it("retorna 422 cuando apodo_maquina excede 100 caracteres", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });

    const res = await createApp({ POST: routes.POST })
      .post("/api/maquinas")
      .send({ ...VALID_PAYLOAD, apodo_maquina: "A".repeat(101) });
    expect(res.status).toBe(422);
  });

  it("retorna 422 cuando descripcion excede 200 caracteres", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });

    const res = await createApp({ POST: routes.POST })
      .post("/api/maquinas")
      .send({ ...VALID_PAYLOAD, descripcion: "A".repeat(201) });
    expect(res.status).toBe(422);
  });

  it("retorna 422 cuando nombre_maquina es cadena vacía", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });

    const res = await createApp({ POST: routes.POST })
      .post("/api/maquinas")
      .send({ ...VALID_PAYLOAD, nombre_maquina: "" });
    expect(res.status).toBe(422);
  });

  it("acepta los tres tipos de máquina válidos", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });

    for (const tipo of ["Láser CO2", "Láser Fibra", "Bordadora"]) {
      mockCreate.mockResolvedValue({ ...CREATED_MAQUINA, tipo });

      const res = await createApp({ POST: routes.POST })
        .post("/api/maquinas")
        .send({ ...VALID_PAYLOAD, tipo });
      expect(res.status).toBe(201);
      expect(res.body.data.tipo).toBe(tipo);
    }
  });
});

// ---------------------------------------------------------------------------
// PUT /api/maquinas/[id] — Editar Máquina
// ---------------------------------------------------------------------------
describe("PUT /api/maquinas/[id] — Editar Máquina", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let routes: any;

  beforeAll(async () => {
    routes = await import("@/app/api/maquinas/[id]/route");
  });

  beforeEach(() => jest.clearAllMocks());

  it("retorna 401 sin sesión activa", async () => {
    mockGetSession.mockResolvedValue(null);

    const res = await makeAppWithId("PUT", { PUT: routes.PUT })
      .put("/api/maquinas/1")
      .send({ nombre_maquina: "Nuevo nombre" });
    expect(res.status).toBe(401);
  });

  it("retorna 403 cuando el rol es Colaborador", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Colaborador" });

    const res = await makeAppWithId("PUT", { PUT: routes.PUT })
      .put("/api/maquinas/1")
      .send({ nombre_maquina: "Nuevo nombre" });
    expect(res.status).toBe(403);
  });

  it("retorna 200 con los datos actualizados", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    mockUpdate.mockResolvedValue({ ...CREATED_MAQUINA, nombre_maquina: "Nuevo nombre" });

    const res = await makeAppWithId("PUT", { PUT: routes.PUT })
      .put("/api/maquinas/1")
      .send({ nombre_maquina: "Nuevo nombre" });

    expect(res.status).toBe(200);
    expect(res.body.data.nombre_maquina).toBe("Nuevo nombre");
  });

  it("acepta rol Administrador como equivalente a Direccion", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Administrador" });
    mockUpdate.mockResolvedValue(CREATED_MAQUINA);

    const res = await makeAppWithId("PUT", { PUT: routes.PUT })
      .put("/api/maquinas/1")
      .send({ apodo_maquina: "Aguila" });
    expect(res.status).toBe(200);
  });

  it("retorna 404 cuando la máquina no existe", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    mockUpdate.mockRejectedValue({ code: "P2025" });

    const res = await makeAppWithId("PUT", { PUT: routes.PUT })
      .put("/api/maquinas/999")
      .send({ nombre_maquina: "No existe" });

    expect(res.status).toBe(404);
    expect(res.body.error).toContain("no encontrada");
  });

  it("retorna 422 cuando el id no es un número", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });

    const res = await makeAppWithId("PUT", { PUT: routes.PUT })
      .put("/api/maquinas/abc")
      .send({ nombre_maquina: "Test" });
    expect(res.status).toBe(422);
  });

  it("retorna 422 cuando tipo no es un valor permitido", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });

    const res = await makeAppWithId("PUT", { PUT: routes.PUT })
      .put("/api/maquinas/1")
      .send({ tipo: "Tipo inválido" });

    expect(res.status).toBe(422);
    expect(res.body.error).toContain("tipo");
  });

  it("retorna 422 cuando descripcion excede 200 caracteres", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });

    const res = await makeAppWithId("PUT", { PUT: routes.PUT })
      .put("/api/maquinas/1")
      .send({ descripcion: "A".repeat(201) });
    expect(res.status).toBe(422);
  });
});

// ---------------------------------------------------------------------------
// PUT /api/maquinas/[id]/sucursales — Asignar Sucursal
// ---------------------------------------------------------------------------
describe("PUT /api/maquinas/[id]/sucursales — Asignar Sucursal", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let routes: any;

  beforeAll(async () => {
    routes = await import("@/app/api/maquinas/[id]/sucursales/route");
  });

  beforeEach(() => jest.clearAllMocks());

  it("retorna 401 sin sesión activa", async () => {
    mockGetSession.mockResolvedValue(null);

    const res = await makeAppWithSucursalId({ PUT: routes.PUT })
      .put("/api/maquinas/1/sucursales")
      .send({ sucursal: 1 });
    expect(res.status).toBe(401);
  });

  it("retorna 403 cuando el rol es Colaborador", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Colaborador" });

    const res = await makeAppWithSucursalId({ PUT: routes.PUT })
      .put("/api/maquinas/1/sucursales")
      .send({ sucursal: 1 });
    expect(res.status).toBe(403);
  });

  it("retorna 200 al crear una nueva asignación", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    mockSucursalFindFirst.mockResolvedValue(null);
    mockSucursalCreate.mockResolvedValue({ id_sucursal_maquina: 1, id_maquina: 1, id_sucursal: 1 });
    mockFindUnique.mockResolvedValue(CREATED_MAQUINA);

    const res = await makeAppWithSucursalId({ PUT: routes.PUT })
      .put("/api/maquinas/1/sucursales")
      .send({ sucursal: 1 });

    expect(res.status).toBe(200);
    expect(mockSucursalCreate).toHaveBeenCalled();
  });

  it("retorna 200 al actualizar una asignación existente", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    mockSucursalFindFirst.mockResolvedValue({
      id_sucursal_maquina: 5,
      id_maquina: 1,
      id_sucursal: 1,
    });
    mockSucursalUpdate.mockResolvedValue({ id_sucursal_maquina: 5, id_maquina: 1, id_sucursal: 2 });
    mockFindUnique.mockResolvedValue(CREATED_MAQUINA);

    const res = await makeAppWithSucursalId({ PUT: routes.PUT })
      .put("/api/maquinas/1/sucursales")
      .send({ sucursal: 2 });

    expect(res.status).toBe(200);
    expect(mockSucursalUpdate).toHaveBeenCalled();
    expect(mockSucursalCreate).not.toHaveBeenCalled();
  });

  it("acepta rol Administrador como equivalente a Direccion", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Administrador" });
    mockSucursalFindFirst.mockResolvedValue(null);
    mockSucursalCreate.mockResolvedValue({});
    mockFindUnique.mockResolvedValue(CREATED_MAQUINA);

    const res = await makeAppWithSucursalId({ PUT: routes.PUT })
      .put("/api/maquinas/1/sucursales")
      .send({ sucursal: 1 });
    expect(res.status).toBe(200);
  });

  it("retorna 422 cuando el id no es un número", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });

    const res = await makeAppWithSucursalId({ PUT: routes.PUT })
      .put("/api/maquinas/abc/sucursales")
      .send({ sucursal: 1 });
    expect(res.status).toBe(422);
  });

  it("retorna 422 cuando sucursales no es un arreglo", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });

    const res = await makeAppWithSucursalId({ PUT: routes.PUT })
      .put("/api/maquinas/1/sucursales")
      .send({ sucursal: "no-soy-un-array" });
    expect(res.status).toBe(422);
  });

  it("retorna 422 cuando sucursales contiene valores no numéricos", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });

    const res = await makeAppWithSucursalId({ PUT: routes.PUT })
      .put("/api/maquinas/1/sucursales")
      .send({ sucursal: ["abc"] });
    expect(res.status).toBe(422);
  });

  it("retorna 404 cuando la máquina no existe", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    mockSucursalFindFirst.mockResolvedValue(null);
    mockSucursalCreate.mockResolvedValue({});
    mockFindUnique.mockResolvedValue(null);

    const res = await makeAppWithSucursalId({ PUT: routes.PUT })
      .put("/api/maquinas/999/sucursales")
      .send({ sucursal: 1 });
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/maquinas/[id] — Eliminar Máquina (Soft Delete)
// ---------------------------------------------------------------------------
describe("DELETE /api/maquinas/[id] — Eliminar Máquina (Soft Delete)", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let routes: any;

  beforeAll(async () => {
    routes = await import("@/app/api/maquinas/[id]/route");
  });

  beforeEach(() => jest.clearAllMocks());

  it("retorna 401 sin sesión activa", async () => {
    mockGetSession.mockResolvedValue(null);

    const res = await makeAppWithId("DELETE", { DELETE: routes.DELETE }).delete("/api/maquinas/1");
    expect(res.status).toBe(401);
  });

  it("retorna 403 cuando el rol es Colaborador", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Colaborador" });

    const res = await makeAppWithId("DELETE", { DELETE: routes.DELETE }).delete("/api/maquinas/1");
    expect(res.status).toBe(403);
  });

  it("retorna 204 y llama update con estatus Inactiva", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    mockUpdate.mockResolvedValue({ ...CREATED_MAQUINA, estatus: "Inactiva" });

    const res = await makeAppWithId("DELETE", { DELETE: routes.DELETE }).delete("/api/maquinas/1");

    expect(res.status).toBe(204);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id_maquina: 1 },
        data: { estatus: "Inactiva" },
      })
    );
  });

  it("acepta rol Administrador como equivalente a Direccion", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Administrador" });
    mockUpdate.mockResolvedValue({ ...CREATED_MAQUINA, estatus: "Inactiva" });

    const res = await makeAppWithId("DELETE", { DELETE: routes.DELETE }).delete("/api/maquinas/1");
    expect(res.status).toBe(204);
  });

  it("retorna 404 cuando la máquina no existe", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    mockUpdate.mockRejectedValue({ code: "P2025" });

    const res = await makeAppWithId("DELETE", { DELETE: routes.DELETE }).delete(
      "/api/maquinas/999"
    );

    expect(res.status).toBe(404);
    expect(res.body.error).toContain("no encontrada");
  });

  it("retorna 422 cuando el id no es un número", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });

    const res = await makeAppWithId("DELETE", { DELETE: routes.DELETE }).delete(
      "/api/maquinas/abc"
    );
    expect(res.status).toBe(422);
  });

  it("no elimina el registro de la base de datos", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    mockUpdate.mockResolvedValue({ ...CREATED_MAQUINA, estatus: "Inactiva" });

    await makeAppWithId("DELETE", { DELETE: routes.DELETE }).delete("/api/maquinas/1");

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { estatus: "Inactiva" } })
    );
  });

  it("retorna 500 si ocurre un error inesperado", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    mockUpdate.mockRejectedValue(new Error("Database connection failed"));

    const res = await makeAppWithId("DELETE", { DELETE: routes.DELETE }).delete("/api/maquinas/1");
    expect(res.status).toBe(500);
  });
});
