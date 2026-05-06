/**
 * @jest-environment node
 */
import * as proveedoresService from "@/lib/services/proveedores";

import { createApp } from "../helpers/next-supertest";

jest.mock("@/lib/services/proveedores", () => ({
  getProviderAssignments: jest.fn(),
  syncProviderAssignments: jest.fn(),
}));

const mockGetSession = jest.fn();
jest.mock("@/lib/auth/session", () => ({
  getSession: () => mockGetSession(),
}));

const mockGetAssignments = proveedoresService.getProviderAssignments as jest.Mock;
const mockSyncAssignments = proveedoresService.syncProviderAssignments as jest.Mock;

describe("GET /api/proveedores/[id]/asignacion", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let routes: any;

  beforeAll(async () => {
    routes = await import("@/app/api/proveedores/[id]/asignacion/route");
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function testApp() {
    return createApp({ GET: routes.GET }, (url) => {
      const segments = url.pathname.split("/");
      // Path format: /api/proveedores/123/asignacion
      return { id: segments[segments.length - 2] };
    });
  }

  it("retorna 401 si no hay sesión", async () => {
    mockGetSession.mockResolvedValue(null);
    const res = await testApp().get("/api/proveedores/1/asignacion");
    expect(res.status).toBe(401);
  });

  it("retorna 403 si el rol no es Direccion", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Colaborador" });
    const res = await testApp().get("/api/proveedores/1/asignacion");
    expect(res.status).toBe(403);
  });

  it("retorna 200 con las asignaciones si es Direccion", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    mockGetAssignments.mockResolvedValue({ serviceIds: [1], materialIds: [2] });

    const res = await testApp().get("/api/proveedores/1/asignacion");

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ serviceIds: [1], materialIds: [2] });
    expect(mockGetAssignments).toHaveBeenCalledWith(1);
  });

  it("retorna 403 si el rol es Vendedor (no autorizado para ver asignaciones)", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Vendedor" });
    const res = await testApp().get("/api/proveedores/1/asignacion");
    expect(res.status).toBe(403);
  });

  it("retorna 404 si el proveedor no existe", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    const { NotFoundError } = await import("@/lib/utils/errors");
    mockGetAssignments.mockRejectedValue(new NotFoundError("Proveedor no encontrado"));

    const res = await testApp().get("/api/proveedores/999/asignacion");
    expect(res.status).toBe(404);
  });
});

describe("PUT /api/proveedores/[id]/asignacion", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let routes: any;

  beforeAll(async () => {
    routes = await import("@/app/api/proveedores/[id]/asignacion/route");
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function testApp() {
    return createApp({ PUT: routes.PUT }, (url) => {
      const segments = url.pathname.split("/");
      return { id: segments[segments.length - 2] };
    });
  }

  it("retorna 200 tras una sincronización exitosa", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    mockSyncAssignments.mockResolvedValue(undefined);

    const res = await testApp()
      .put("/api/proveedores/1/asignacion")
      .send({ type: "servicio", items: [{ id: 5, precio: 100 }, { id: 6, precio: 200 }] });

    expect(res.status).toBe(200);
    expect(res.body.data.success).toBe(true);
    expect(mockSyncAssignments).toHaveBeenCalledWith(
      1,
      "servicio",
      [{ id: 5, precio: 100 }, { id: 6, precio: 200 }]
    );
  });

  it("retorna 422 si el body es inválido", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });

    const res = await testApp()
      .put("/api/proveedores/1/asignacion")
      .send({ type: "invalido", items: "no-soy-un-array" });

    expect(res.status).toBe(422);
  });

  it("permite que un Administrador asigne (intercambiable con Direccion)", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Administrador" });
    mockSyncAssignments.mockResolvedValue(undefined);

    const res = await testApp()
      .put("/api/proveedores/1/asignacion")
      .send({ type: "servicio", items: [{ id: 1, precio: 50 }] });

    expect(res.status).toBe(200);
  });

  it("permite enviar un arreglo vacío para eliminar todas las asignaciones", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    mockSyncAssignments.mockResolvedValue(undefined);

    const res = await testApp()
      .put("/api/proveedores/1/asignacion")
      .send({ type: "material", items: [] });

    expect(res.status).toBe(200);
    expect(mockSyncAssignments).toHaveBeenCalledWith(1, "material", []);
  });

  it("retorna 403 si el rol es Vendedor (no autorizado para modificar)", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Vendedor" });
    const res = await testApp()
      .put("/api/proveedores/1/asignacion")
      .send({ type: "servicio", items: [{ id: 1, precio: 50 }] });

    expect(res.status).toBe(403);
  });

  it("retorna 500 si ocurre un error inesperado en el servicio", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    mockSyncAssignments.mockRejectedValue(new Error("Database connection failed"));

    const res = await testApp()
      .put("/api/proveedores/1/asignacion")
      .send({ type: "servicio", items: [{ id: 1, precio: 50 }] });

    expect(res.status).toBe(500);
  });

  it("retorna 404 si el proveedor no existe al intentar sincronizar", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    const { NotFoundError } = await import("@/lib/utils/errors");
    mockSyncAssignments.mockRejectedValue(new NotFoundError("Proveedor no encontrado"));

    const res = await testApp()
      .put("/api/proveedores/999/asignacion")
      .send({ type: "servicio", items: [{ id: 1, precio: 50 }] });

    expect(res.status).toBe(404);
  });
});
