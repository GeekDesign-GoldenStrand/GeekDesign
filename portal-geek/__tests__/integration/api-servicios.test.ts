/**
 * @jest-environment node
 */
import { Prisma } from "@prisma/client";

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
    servicioMaterial: {
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
const mockUpdate = prisma.servicios.update as jest.Mock;

const mockGetSession = jest.fn();
jest.mock("@/lib/auth/session", () => ({
  getSession: () => mockGetSession(),
}));

const SERVICIO_PARA_ADMIN_MOCK = {
  id_servicio: 1,
  id_estatus: 1,
  id_sucursal: 1,
  id_instalador: null,
  id_proveedor: null,
  nombre_servicio: "Corte Láser",
  descripcion_servicio: "Corte con láser CO2",
  estatus_servicio: true,
  imagen_url: null,
  costo_instalador_override: null,
  costo_proveedor_override: null,
  fecha_modificacion: new Date("2026-05-08"),
  sucursal: { id_sucursal: 1, nombre_sucursal: "Sucursal Principal" },
  maquinas: [],
  instalador: null,
  proveedor: null,
  formulas: [],
  servicioMateriales: [],
};

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

  it("retorna 403 cuando un Colaborador pide lista completa (servicios es Dirección-only)", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Colaborador" });

    const res = await createApp({ GET: routes.GET }).get("/api/servicios");

    expect(res.status).toBe(403);
  });

  it("retorna 403 cuando Finanzas pide lista completa", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Finanzas" });

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

  it("retorna 401 sin sesión activa", async () => {
    mockGetSession.mockResolvedValue(null);

    const res = await detailApp().get("/api/servicios/1");

    expect(res.status).toBe(401);
  });

  it("retorna 403 cuando el rol no es Administrador ni Direccion", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Colaborador" });

    const res = await detailApp().get("/api/servicios/1");

    expect(res.status).toBe(403);
  });

  it("retorna 200 con detalle del servicio (Administrador)", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Administrador" });
    mockFindFirst.mockResolvedValue(SERVICIO_PARA_ADMIN_MOCK);

    const res = await detailApp().get("/api/servicios/1");

    expect(res.status).toBe(200);
    expect(res.body.data.id_servicio).toBe(1);
    expect(res.body.data.nombre_servicio).toBe("Corte Láser");
  });

  it("retorna 200 con detalle del servicio (Direccion)", async () => {
    mockGetSession.mockResolvedValue({ id: 2, role: "Direccion" });
    mockFindFirst.mockResolvedValue(SERVICIO_PARA_ADMIN_MOCK);

    const res = await detailApp().get("/api/servicios/1");

    expect(res.status).toBe(200);
    expect(res.body.data.id_servicio).toBe(1);
  });

  it("retorna 200 con detalle del servicio incluyendo formula y materiales", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Administrador" });
    mockFindFirst.mockResolvedValue({
      ...SERVICIO_PARA_ADMIN_MOCK,
      formulas: [
        {
          id_formula: 1,
          expresion: "ancho * 2",
          variables: [],
          constantes: [],
        },
      ],
      servicioMateriales: [
        {
          id_material: 1,
          material: { id_material: 1, nombre_material: "MDF 3mm" },
          proveedorPrecio: null,
        },
      ],
    });

    const res = await detailApp().get("/api/servicios/1");

    expect(res.status).toBe(200);
    expect(res.body.data.id_servicio).toBe(1);
    expect(res.body.data.formulaActiva).not.toBeNull();
    expect(res.body.data.materiales).toHaveLength(1);
  });

  it("retorna 404 cuando el servicio no existe", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Administrador" });
    mockFindFirst.mockResolvedValue(null);

    const res = await detailApp().get("/api/servicios/999");

    expect(res.status).toBe(404);
    expect(res.body.error).toContain("no encontrado");
  });

  // KIKW12 review #5: a servicio without an Activa formula is a valid state.
  // The endpoint returns 200 with the servicio (formulas: []); the storefront
  // detail page renders a "Cotización en línea no disponible" fallback in
  // place of the variables form.
  it("returns 200 with empty formulas[] when servicio has no Activa formula", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Administrador" });
    mockFindFirst.mockResolvedValue({
      ...SERVICIO_PARA_ADMIN_MOCK,
      formulas: [],
    });

    const res = await detailApp().get("/api/servicios/1");

    expect(res.status).toBe(200);
    expect(res.body.data.formulaActiva).toBeNull();
  });

  it("retorna 422 cuando el id no es un número válido", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Administrador" });

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

  it("resuelve el estatus 'Activo' en el servidor cuando el cliente no envía id_estatus", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Administrador" });

    const findFirstOrThrow = jest.fn().mockResolvedValue({ id_estatus_servicio: 1 });
    mockTransaction.mockImplementation(async (callback) => {
      const tx = {
        estatusServicio: { findFirstOrThrow },
        servicios: {
          create: jest.fn().mockResolvedValue({ id_servicio: 10, id_estatus: 1 }),
        },
        serviciosMaquina: { createMany: jest.fn() },
        formulas: { create: jest.fn() },
        formulaVariables: { createMany: jest.fn() },
        formulaConstantes: { createMany: jest.fn() },
      };
      return callback(tx);
    });

    const res = await createApp({ POST: routes.POST })
      .post("/api/servicios")
      .send({ nombre_servicio: "Corte Láser", id_sucursal: 1, estatus_servicio: true });

    expect(res.status).toBe(201);
    expect(findFirstOrThrow).toHaveBeenCalledWith({ where: { descripcion: "Activo" } });
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
        estatusServicio: {
          findFirstOrThrow: jest.fn().mockResolvedValue({ id_estatus_servicio: 1 }),
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
        estatusServicio: {
          findFirstOrThrow: jest.fn().mockResolvedValue({ id_estatus_servicio: 1 }),
        },
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

  it("retorna 201 y guarda el servicio con imágenes en imagen_url serializadas", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Administrador" });

    const txCreate = jest.fn().mockResolvedValue({
      id_servicio: 12,
      nombre_servicio: "Servicio Con Imágenes",
      id_estatus: 1,
      id_sucursal: 1,
      estatus_servicio: true,
      imagen_url: JSON.stringify([
        "servicios/2026/05/11111111-2222-3333-4444-555555555551.png",
        "servicios/2026/05/11111111-2222-3333-4444-555555555552.png",
      ]),
    });

    mockTransaction.mockImplementation(async (callback) => {
      const tx = {
        servicios: {
          create: txCreate,
        },
        estatusServicio: {
          findFirstOrThrow: jest.fn().mockResolvedValue({ id_estatus_servicio: 1 }),
        },
        serviciosMaquina: { createMany: jest.fn() },
        formulas: { create: jest.fn() },
        formulaVariables: { createMany: jest.fn() },
        formulaConstantes: { createMany: jest.fn() },
      };
      return callback(tx);
    });

    const res = await createApp({ POST: routes.POST })
      .post("/api/servicios")
      .send({
        nombre_servicio: "Servicio Con Imágenes",
        id_sucursal: 1,
        estatus_servicio: true,
        imagenes: [
          "servicios/2026/05/11111111-2222-3333-4444-555555555551.png",
          "servicios/2026/05/11111111-2222-3333-4444-555555555552.png",
        ],
      });

    expect(res.status).toBe(201);
    expect(txCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          imagen_url: JSON.stringify([
            "servicios/2026/05/11111111-2222-3333-4444-555555555551.png",
            "servicios/2026/05/11111111-2222-3333-4444-555555555552.png",
          ]),
        }),
      })
    );
  });
});

describe("PUT /api/servicios/[id] — ADMIN-02 Modificar servicio", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let routes: any;

  beforeAll(async () => {
    routes = await import("@/app/api/servicios/[id]/route");
  });

  beforeEach(() => jest.clearAllMocks());

  function putApp() {
    return createApp({ PUT: routes.PUT }, (url) => {
      const segments = url.pathname.split("/");
      return { id: segments[segments.length - 1] };
    });
  }

  it("retorna 401 sin sesión activa", async () => {
    mockGetSession.mockResolvedValue(null);

    const res = await putApp().put("/api/servicios/1").send({ nombre_servicio: "Nuevo" });

    expect(res.status).toBe(401);
  });

  it("retorna 403 cuando el rol no es Administrador ni Direccion", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Colaborador" });

    const res = await putApp().put("/api/servicios/1").send({ nombre_servicio: "Nuevo" });

    expect(res.status).toBe(403);
  });

  it("retorna 422 cuando el body tiene datos inválidos (nombre_servicio vacío)", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Administrador" });

    const res = await putApp().put("/api/servicios/1").send({ nombre_servicio: "" });

    expect(res.status).toBe(422);
    expect(res.body.error).toContain("nombre_servicio");
  });

  it("retorna 404 cuando el servicio no existe o está inactivo", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Administrador" });
    mockFindFirst.mockResolvedValue(null);

    const res = await putApp().put("/api/servicios/999").send({ nombre_servicio: "Nuevo" });

    expect(res.status).toBe(404);
    expect(res.body.error).toContain("no encontrado");
  });

  it("retorna 422 cuando el id no es un número válido", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Administrador" });

    const res = await putApp().put("/api/servicios/abc").send({ nombre_servicio: "Nuevo" });

    expect(res.status).toBe(422);
  });

  it("retorna 200 con el servicio actualizado (Administrador)", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Administrador" });
    mockFindFirst.mockResolvedValue(SERVICIO_PARA_ADMIN_MOCK);

    mockTransaction.mockImplementation(async (callback) => {
      const tx = {
        servicios: { update: jest.fn().mockResolvedValue({ id_servicio: 1 }) },
        servicioMaquina: { deleteMany: jest.fn(), createMany: jest.fn() },
        servicioMaterial: { deleteMany: jest.fn(), createMany: jest.fn() },
        formulas: {
          findMany: jest.fn().mockResolvedValue([]),
          updateMany: jest.fn(),
          create: jest.fn().mockResolvedValue({ id_formula: 1 }),
        },
        formulaVariables: { updateMany: jest.fn(), createMany: jest.fn() },
        formulaConstantes: { createMany: jest.fn() },
        sucursales: { findFirst: jest.fn().mockResolvedValue({ id_sucursal: 1 }) },
        instaladores: { findFirst: jest.fn() },
        proveedores: { findFirst: jest.fn() },
        maquinas: { findMany: jest.fn().mockResolvedValue([]) },
        materiales: { findMany: jest.fn().mockResolvedValue([]) },
      };
      return callback(tx);
    });

    const res = await putApp()
      .put("/api/servicios/1")
      .send({ nombre_servicio: "Corte Láser Actualizado", id_sucursal: 1 });

    expect(res.status).toBe(200);
    expect(res.body.data.id_servicio).toBe(1);
  });

  it("retorna 422 cuando FK de sucursal no existe (ValidationError)", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Administrador" });
    mockFindFirst.mockResolvedValue(SERVICIO_PARA_ADMIN_MOCK);

    mockTransaction.mockImplementation(async (callback) => {
      const tx = {
        servicios: { update: jest.fn() },
        servicioMaquina: { deleteMany: jest.fn(), createMany: jest.fn() },
        servicioMaterial: { deleteMany: jest.fn(), createMany: jest.fn() },
        formulas: { findMany: jest.fn(), updateMany: jest.fn(), create: jest.fn() },
        formulaVariables: { updateMany: jest.fn(), createMany: jest.fn() },
        formulaConstantes: { createMany: jest.fn() },
        sucursales: { findFirst: jest.fn().mockResolvedValue(null) },
        instaladores: { findFirst: jest.fn() },
        proveedores: { findFirst: jest.fn() },
        maquinas: { findMany: jest.fn().mockResolvedValue([]) },
        materiales: { findMany: jest.fn().mockResolvedValue([]) },
      };
      return callback(tx);
    });

    const res = await putApp().put("/api/servicios/1").send({ id_sucursal: 99 });

    expect(res.status).toBe(422);
    expect(res.body.error).toContain("Sucursal");
  });
});

describe("DELETE /api/servicios/[id] — ADMIN-03 Eliminar servicio (soft delete)", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let routes: any;

  beforeAll(async () => {
    routes = await import("@/app/api/servicios/[id]/route");
  });

  beforeEach(() => jest.clearAllMocks());

  function deleteApp() {
    return createApp({ DELETE: routes.DELETE }, (url) => {
      const segments = url.pathname.split("/");
      return { id: segments[segments.length - 1] };
    });
  }

  it("retorna 401 sin sesión activa", async () => {
    mockGetSession.mockResolvedValue(null);

    const res = await deleteApp().delete("/api/servicios/1");

    expect(res.status).toBe(401);
  });

  it("retorna 403 cuando el rol no es Administrador ni Direccion", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Colaborador" });

    const res = await deleteApp().delete("/api/servicios/1");

    expect(res.status).toBe(403);
  });

  it("retorna 204 y llama update con estatus_servicio: false (Administrador)", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Administrador" });
    mockUpdate.mockResolvedValue({ id_servicio: 1, estatus_servicio: false });

    const res = await deleteApp().delete("/api/servicios/1");

    expect(res.status).toBe(204);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id_servicio: 1 },
        data: { estatus_servicio: false },
      })
    );
  });

  it("acepta rol Direccion como equivalente a Administrador", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    mockUpdate.mockResolvedValue({ id_servicio: 1, estatus_servicio: false });

    const res = await deleteApp().delete("/api/servicios/1");

    expect(res.status).toBe(204);
  });

  it("retorna 404 cuando el servicio no existe (P2025)", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Administrador" });
    mockUpdate.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Record not found", {
        code: "P2025",
        clientVersion: "7.8.0",
      })
    );

    const res = await deleteApp().delete("/api/servicios/999");

    expect(res.status).toBe(404);
    expect(res.body.error).toContain("no encontrado");
  });

  it("retorna 422 cuando el id no es un número válido", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Administrador" });

    const res = await deleteApp().delete("/api/servicios/abc");

    expect(res.status).toBe(422);
  });
});

describe("PUT /api/servicios/[id]", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let routes: any;

  beforeAll(async () => {
    routes = await import("@/app/api/servicios/[id]/route");
  });

  beforeEach(() => jest.clearAllMocks());

  function putApp() {
    return createApp({ PUT: routes.PUT }, (url) => {
      const segments = url.pathname.split("/");
      return { id: segments[segments.length - 1] };
    });
  }

  it("retorna 401 sin sesión activa", async () => {
    mockGetSession.mockResolvedValue(null);

    const res = await putApp().put("/api/servicios/1").send({ nombre_servicio: "Test" });

    expect(res.status).toBe(401);
  });

  it("retorna 200 y actualiza el servicio con imágenes serializadas", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Administrador" });
    mockFindFirst.mockResolvedValue(SERVICIO_PARA_ADMIN_MOCK);

    const mockTx = {
      servicios: {
        update: jest.fn().mockResolvedValue({ id_servicio: 1, nombre_servicio: "Updated" }),
      },
      servicioMaquina: { deleteMany: jest.fn(), createMany: jest.fn() },
      servicioMaterial: { deleteMany: jest.fn(), createMany: jest.fn() },
      formulas: {
        findMany: jest.fn().mockResolvedValue([]),
        updateMany: jest.fn(),
        create: jest.fn(),
      },
      formulaVariables: { updateMany: jest.fn(), createMany: jest.fn() },
      formulaConstantes: { createMany: jest.fn() },
    };

    mockTransaction.mockImplementation(async (callback) => callback(mockTx));

    const res = await putApp()
      .put("/api/servicios/1")
      .send({
        nombre_servicio: "Updated",
        imagenes: [
          "servicios/2026/05/11111111-2222-3333-4444-555555555553.jpg",
          "servicios/2026/05/11111111-2222-3333-4444-555555555554.jpg",
        ],
      });

    expect(res.status).toBe(200);
    expect(mockTx.servicios.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id_servicio: 1 },
        data: expect.objectContaining({
          imagen_url: JSON.stringify([
            "servicios/2026/05/11111111-2222-3333-4444-555555555553.jpg",
            "servicios/2026/05/11111111-2222-3333-4444-555555555554.jpg",
          ]),
        }),
      })
    );
  });
});
