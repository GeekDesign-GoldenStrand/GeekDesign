/**
 * @jest-environment node
 */
import { prisma } from "@/lib/db/client";

import { createApp } from "../helpers/next-supertest";

jest.mock("@/lib/db/client", () => ({
  prisma: {
    $transaction: jest.fn(),
    servicios: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    serviciosMaquina: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    formulas: {
      create: jest.fn(),
      updateMany: jest.fn(),
    },
    formulaVariables: {
      createMany: jest.fn(),
    },
    formulaConstantes: {
      createMany: jest.fn(),
    },
  },
}));

const mockFindMany = prisma.servicios.findMany as jest.Mock;
const mockCount = prisma.servicios.count as jest.Mock;
const mockFindFirst = prisma.servicios.findFirst as jest.Mock;
const mockTransaction = prisma.$transaction as jest.Mock;

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

  // TODO: Este test asume que activo=true es ruta pública, pero el GET actual
  // está protegido con withRole(["Administrador"]). Requiere decisión de producto.

  it.skip("retorna 200 con lista paginada cuando activo=true (ruta pública)", async () => {
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

  // TODO: Mismo issue que el test anterior — espera 200 sin sesión en ruta admin-only.
  it.skip("respeta parámetros de paginación", async () => {
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
      .send({ nombre_servicio: "Corte Láser", id_sucursal: 1 });

    expect(res.status).toBe(422);
    expect(res.body.error).toContain("id_estatus");
  });

  it("retorna 403 cuando un Colaborador intenta crear", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Colaborador" });

    const res = await createApp({ POST: routes.POST }).post("/api/servicios").send({
      nombre_servicio: "Test",
      id_estatus: 1,
      id_sucursal: 1,
    });

    expect(res.status).toBe(403);
  });

  it("retorna 201 con servicio creado cuando el body es válido (sin máquinas ni fórmula)", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Administrador" });

    mockTransaction.mockImplementation(async (callback) => {
      const tx = {
        servicios: {
          create: jest.fn().mockResolvedValue({
            id_servicio: 10,
            nombre_servicio: "Servicio Test",
            descripcion_servicio: "Descripción de prueba",
            id_estatus: 1,
            id_sucursal: 1,
            estatus_servicio: true,
            id_instalador: null,
            id_proveedor: null,
            costo_instalador_override: null,
            costo_proveedor_override: null,
          }),
        },
        serviciosMaquina: { createMany: jest.fn() },
        formulas: { create: jest.fn() },
        formulaVariables: { createMany: jest.fn() },
        formulaConstantes: { createMany: jest.fn() },
      };
      return callback(tx);
    });

    const res = await createApp({ POST: routes.POST }).post("/api/servicios").send({
      nombre_servicio: "Servicio Test",
      descripcion_servicio: "Descripción de prueba",
      id_estatus: 1,
      id_sucursal: 1,
      estatus_servicio: true,
    });

    expect(res.status).toBe(201);
    expect(res.body.data.nombre_servicio).toBe("Servicio Test");
    expect(res.body.data.id_servicio).toBe(10);
  });

  it("retorna 201 cuando se crea un servicio con fórmula (variables y constantes)", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Administrador" });

    const txServicios = {
      create: jest.fn().mockResolvedValue({
        id_servicio: 11,
        nombre_servicio: "Corte con fórmula",
        id_estatus: 1,
        id_sucursal: 1,
        estatus_servicio: true,
      }),
    };
    const txFormulas = {
      create: jest.fn().mockResolvedValue({ id_formula: 1, estatus: "Activa" }),
    };
    const txFormulaVariables = { createMany: jest.fn().mockResolvedValue({ count: 2 }) };
    const txFormulaConstantes = { createMany: jest.fn().mockResolvedValue({ count: 1 }) };

    mockTransaction.mockImplementation(async (callback) => {
      const tx = {
        servicios: txServicios,
        serviciosMaquina: { createMany: jest.fn() },
        formulas: txFormulas,
        formulaVariables: txFormulaVariables,
        formulaConstantes: txFormulaConstantes,
      };
      return callback(tx);
    });

    const res = await createApp({ POST: routes.POST })
      .post("/api/servicios")
      .send({
        nombre_servicio: "Corte con fórmula",
        id_estatus: 1,
        id_sucursal: 1,
        estatus_servicio: true,
        formula: {
          expresion: "ancho * largo * 0.5",
          variables: [
            {
              id_tipo_variable: 1,
              nombre_variable: "ancho",
              etiqueta: "Ancho (cm)",
              editable_por_cliente: true,
            },
            {
              id_tipo_variable: 1,
              nombre_variable: "largo",
              etiqueta: "Largo (cm)",
              editable_por_cliente: true,
            },
          ],
          constantes: [
            {
              nombre_constante: "factor_merma",
              origen: "manual",
              valor: 1.15,
            },
          ],
        },
      });

    expect(res.status).toBe(201);
    expect(txFormulas.create).toHaveBeenCalledTimes(1);
    expect(txFormulaVariables.createMany).toHaveBeenCalledTimes(1);
    expect(txFormulaConstantes.createMany).toHaveBeenCalledTimes(1);
  });

  it("retorna 422 cuando la expresión de la fórmula está vacía", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Administrador" });

    const res = await createApp({ POST: routes.POST })
      .post("/api/servicios")
      .send({
        nombre_servicio: "Servicio inválido",
        id_estatus: 1,
        id_sucursal: 1,
        formula: {
          expresion: "",
          variables: [],
          constantes: [],
        },
      });

    expect(res.status).toBe(422);
  });

  it("retorna 422 cuando una variable tiene nombre con caracteres inválidos", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Administrador" });

    const res = await createApp({ POST: routes.POST })
      .post("/api/servicios")
      .send({
        nombre_servicio: "Servicio inválido",
        id_estatus: 1,
        id_sucursal: 1,
        formula: {
          expresion: "ancho * 2",
          variables: [
            {
              id_tipo_variable: 1,
              nombre_variable: "ancho con espacios",
              etiqueta: "Ancho",
              editable_por_cliente: true,
            },
          ],
          constantes: [],
        },
      });

    expect(res.status).toBe(422);
  });

  it("retorna 422 cuando una constante con origen instalador no provee id_instalador", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Administrador" });

    const res = await createApp({ POST: routes.POST })
      .post("/api/servicios")
      .send({
        nombre_servicio: "Servicio inválido",
        id_estatus: 1,
        id_sucursal: 1,
        formula: {
          expresion: "x",
          variables: [],
          constantes: [
            {
              nombre_constante: "costo_instalacion",
              origen: "instalador",
            },
          ],
        },
      });

    expect(res.status).toBe(422);
  });
});
