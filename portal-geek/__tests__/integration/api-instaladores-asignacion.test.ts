/**
 * @jest-environment node
 */
import * as instaladoresService from "@/lib/services/instaladores";

import { createApp } from "../helpers/next-supertest";

jest.mock("@/lib/services/instaladores", () => ({
  getInstaladorAssignments: jest.fn(),
  syncInstaladorAssignments: jest.fn(),
}));

const mockGetSession = jest.fn();
jest.mock("@/lib/auth/session", () => ({
  getSession: () => mockGetSession(),
}));

const mockGetAssignments = instaladoresService.getInstaladorAssignments as jest.Mock;
const mockSyncAssignments = instaladoresService.syncInstaladorAssignments as jest.Mock;

describe("GET /api/instaladores/[id]/asignacion", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let routes: any;

  beforeAll(async () => {
    routes = await import("@/app/api/instaladores/[id]/asignacion/route");
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function testApp() {
    return createApp({ GET: routes.GET }, (url) => {
      const segments = url.pathname.split("/");
      return { id: segments[segments.length - 2] };
    });
  }

  it("retorna 401 si no hay sesión", async () => {
    mockGetSession.mockResolvedValue(null);
    const res = await testApp().get("/api/instaladores/1/asignacion");
    expect(res.status).toBe(401);
  });

  it("retorna 403 si el rol no es Direccion", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Colaborador" });
    const res = await testApp().get("/api/instaladores/1/asignacion");
    expect(res.status).toBe(403);
  });

  it("retorna 200 con las asignaciones si es Direccion", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    mockGetAssignments.mockResolvedValue({ serviceIds: [10, 20] });

    const res = await testApp().get("/api/instaladores/1/asignacion");

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ serviceIds: [10, 20] });
    expect(mockGetAssignments).toHaveBeenCalledWith(1);
  });
});

describe("PUT /api/instaladores/[id]/asignacion", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let routes: any;

  beforeAll(async () => {
    routes = await import("@/app/api/instaladores/[id]/asignacion/route");
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
      .put("/api/instaladores/1/asignacion")
      .send({ type: "servicio", ids: [5, 6] });

    expect(res.status).toBe(200);
    expect(res.body.data.success).toBe(true);
    expect(mockSyncAssignments).toHaveBeenCalledWith(1, [5, 6]);
  });

  it("retorna 422 si el body es inválido", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });

    const res = await testApp()
      .put("/api/instaladores/1/asignacion")
      .send({ type: "invalido", ids: [1] });

    expect(res.status).toBe(422);
  });

  it("retorna 422 si el type es material (instaladores solo aceptan servicio)", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });

    const res = await testApp()
      .put("/api/instaladores/1/asignacion")
      .send({ type: "material", ids: [1] });

    expect(res.status).toBe(422);
  });

  it("retorna 403 si el rol es Vendedor", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Vendedor" });
    const res = await testApp()
      .put("/api/instaladores/1/asignacion")
      .send({ type: "servicio", ids: [1] });

    expect(res.status).toBe(403);
  });
});
