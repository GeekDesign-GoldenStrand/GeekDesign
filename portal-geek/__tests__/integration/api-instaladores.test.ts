/**
 * @jest-environment node
 */
import { prisma } from "@/lib/db/client";

import { createApp } from "../helpers/next-supertest";

jest.mock("@/lib/db/client", () => ({
  prisma: {
    $transaction: jest.fn(),
    instaladores: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    },
  },
}));

const mockTransaction = prisma.$transaction as jest.Mock;
const mockCreate = prisma.instaladores.create as jest.Mock;

const mockGetSession = jest.fn();
jest.mock("@/lib/auth/session", () => ({
  getSession: () => mockGetSession(),
}));

const VALID_PAYLOAD = {
  nombre_instalador: "Juan Pérez",
  tipo: "Instalador",
  telefono: "5551234567",
  correo: "juan@example.com",
  estatus: "Activo",
};

const CREATED_INSTALADOR = {
  id_instalador: 1,
  nombre_instalador: "Juan Pérez",
  apodo: null,
  tipo: "Instalador",
  telefono: "5551234567",
  correo: "juan@example.com",
  notas: null,
  ubicacion: null,
  estatus: "Activo",
};

// ---------------------------------------------------------------------------
// POST /api/instaladores
// ---------------------------------------------------------------------------
describe("POST /api/instaladores", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let routes: any;

  beforeAll(async () => {
    routes = await import("@/app/api/instaladores/route");
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- Authorization ---

  it("retorna 401 sin sesión", async () => {
    mockGetSession.mockResolvedValue(null);

    const res = await createApp({ POST: routes.POST })
      .post("/api/instaladores")
      .send(VALID_PAYLOAD);

    expect(res.status).toBe(401);
  });

  it("retorna 403 cuando el rol es Colaborador", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Colaborador" });

    const res = await createApp({ POST: routes.POST })
      .post("/api/instaladores")
      .send(VALID_PAYLOAD);

    expect(res.status).toBe(403);
  });

  it("retorna 403 cuando el rol es Finanzas", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Finanzas" });

    const res = await createApp({ POST: routes.POST })
      .post("/api/instaladores")
      .send(VALID_PAYLOAD);

    expect(res.status).toBe(403);
  });

  // --- Happy path ---

  it("retorna 201 con el instalador creado cuando el rol es Direccion", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    mockCreate.mockResolvedValue(CREATED_INSTALADOR);

    const res = await createApp({ POST: routes.POST })
      .post("/api/instaladores")
      .send(VALID_PAYLOAD);

    expect(res.status).toBe(201);
    expect(res.body.data.id_instalador).toBe(1);
    expect(res.body.data.nombre_instalador).toBe("Juan Pérez");
    expect(res.body.error).toBeNull();
  });

  it("retorna 201 cuando el rol es Administrador (equivalente a Direccion)", async () => {
    mockGetSession.mockResolvedValue({ id: 2, role: "Administrador" });
    mockCreate.mockResolvedValue(CREATED_INSTALADOR);

    const res = await createApp({ POST: routes.POST })
      .post("/api/instaladores")
      .send(VALID_PAYLOAD);

    expect(res.status).toBe(201);
  });

  it("retorna 201 con tipo Contratista", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    mockCreate.mockResolvedValue({ ...CREATED_INSTALADOR, tipo: "Contratista" });

    const res = await createApp({ POST: routes.POST })
      .post("/api/instaladores")
      .send({ ...VALID_PAYLOAD, tipo: "Contratista" });

    expect(res.status).toBe(201);
    expect(res.body.data.tipo).toBe("Contratista");
  });

  it("retorna 201 con campos opcionales incluidos", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    mockCreate.mockResolvedValue({
      ...CREATED_INSTALADOR,
      apodo: "Juanito",
      notas: "Buen instalador",
      ubicacion: "CDMX",
    });

    const res = await createApp({ POST: routes.POST })
      .post("/api/instaladores")
      .send({ ...VALID_PAYLOAD, apodo: "Juanito", notas: "Buen instalador", ubicacion: "CDMX" });

    expect(res.status).toBe(201);
    expect(res.body.data.apodo).toBe("Juanito");
    expect(res.body.data.notas).toBe("Buen instalador");
    expect(res.body.data.ubicacion).toBe("CDMX");
  });

  it("aplica estatus Activo por defecto cuando no se envía", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    mockCreate.mockResolvedValue(CREATED_INSTALADOR);

    const { estatus: _estatus, ...payloadSinEstatus } = VALID_PAYLOAD;
    const res = await createApp({ POST: routes.POST })
      .post("/api/instaladores")
      .send(payloadSinEstatus);

    expect(res.status).toBe(201);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ estatus: "Activo" }) })
    );
  });

  // --- Validation failures ---

  it("retorna 422 cuando falta nombre_instalador", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    const { nombre_instalador: _nombre_instalador, ...rest } = VALID_PAYLOAD;

    const res = await createApp({ POST: routes.POST }).post("/api/instaladores").send(rest);

    expect(res.status).toBe(422);
  });

  it("retorna 422 cuando falta tipo", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    const { tipo: _tipo, ...rest } = VALID_PAYLOAD;

    const res = await createApp({ POST: routes.POST }).post("/api/instaladores").send(rest);

    expect(res.status).toBe(422);
  });

  it("retorna 422 cuando falta telefono", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    const { telefono: _telefono, ...rest } = VALID_PAYLOAD;

    const res = await createApp({ POST: routes.POST }).post("/api/instaladores").send(rest);

    expect(res.status).toBe(422);
  });

  it("retorna 422 cuando falta correo", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    const { correo: _correo, ...rest } = VALID_PAYLOAD;

    const res = await createApp({ POST: routes.POST }).post("/api/instaladores").send(rest);

    expect(res.status).toBe(422);
  });

  it("retorna 422 cuando tipo no es Instalador ni Contratista", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });

    const res = await createApp({ POST: routes.POST })
      .post("/api/instaladores")
      .send({ ...VALID_PAYLOAD, tipo: "Albañil" });

    expect(res.status).toBe(422);
  });

  it("retorna 422 cuando telefono no tiene exactamente 10 dígitos", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });

    const res = await createApp({ POST: routes.POST })
      .post("/api/instaladores")
      .send({ ...VALID_PAYLOAD, telefono: "12345" });

    expect(res.status).toBe(422);
  });

  it("retorna 422 cuando telefono contiene letras", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });

    const res = await createApp({ POST: routes.POST })
      .post("/api/instaladores")
      .send({ ...VALID_PAYLOAD, telefono: "555abc4567" });

    expect(res.status).toBe(422);
  });

  it("retorna 422 cuando correo no tiene formato válido", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });

    const res = await createApp({ POST: routes.POST })
      .post("/api/instaladores")
      .send({ ...VALID_PAYLOAD, correo: "no-es-correo" });

    expect(res.status).toBe(422);
  });

  it("retorna 422 cuando nombre_instalador supera 30 caracteres", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });

    const res = await createApp({ POST: routes.POST })
      .post("/api/instaladores")
      .send({ ...VALID_PAYLOAD, nombre_instalador: "A".repeat(31) });

    expect(res.status).toBe(422);
  });

  it("retorna 422 cuando nombre_instalador tiene caracteres inválidos", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });

    const res = await createApp({ POST: routes.POST })
      .post("/api/instaladores")
      .send({ ...VALID_PAYLOAD, nombre_instalador: "Juan@#$%" });

    expect(res.status).toBe(422);
  });

  it("retorna 422 cuando estatus no es Activo, Inactivo ni Baneado", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });

    const res = await createApp({ POST: routes.POST })
      .post("/api/instaladores")
      .send({ ...VALID_PAYLOAD, estatus: "Suspendido" });

    expect(res.status).toBe(422);
  });
});

// ---------------------------------------------------------------------------
// GET /api/instaladores
// ---------------------------------------------------------------------------
describe("GET /api/instaladores", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let routes: any;

  beforeAll(async () => {
    routes = await import("@/app/api/instaladores/route");
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("retorna 401 sin sesión", async () => {
    mockGetSession.mockResolvedValue(null);

    const res = await createApp({ GET: routes.GET }).get("/api/instaladores");

    expect(res.status).toBe(401);
  });

  it("retorna 403 cuando el rol es Colaborador", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Colaborador" });

    const res = await createApp({ GET: routes.GET }).get("/api/instaladores");

    expect(res.status).toBe(403);
  });

  it("retorna 200 con lista paginada cuando el rol es Direccion", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    mockTransaction.mockResolvedValue([[CREATED_INSTALADOR], 1]);

    const res = await createApp({ GET: routes.GET }).get("/api/instaladores");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.total).toBe(1);
    expect(res.body.page).toBe(1);
  });

  it("respeta los parámetros de paginación", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    mockTransaction.mockResolvedValue([[], 0]);

    const res = await createApp({ GET: routes.GET }).get("/api/instaladores?page=2&pageSize=5");

    expect(res.status).toBe(200);
    expect(res.body.page).toBe(2);
    expect(res.body.pageSize).toBe(5);
  });
});
