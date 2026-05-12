import type { NextRequest } from "next/server";

import { GET, PUT, DELETE } from "@/app/api/sucursales/[id]/route";
import { GET as GET_ALL, POST } from "@/app/api/sucursales/route";
import {
  listSucursales,
  createSucursal,
  getSucursal,
  updateSucursal,
  deleteSucursal,
} from "@/lib/services/sucursales";

jest.mock("@/lib/auth/session", () => ({
  getSession: jest.fn().mockResolvedValue({ id: 1, role: "Direccion" }),
}));

jest.mock("@/lib/auth/guards", () => ({
  withRole:
    (_roles: string[], handler: unknown) => async (req: unknown, ctx: { params?: unknown }) =>
      (handler as (req: NextRequest, ctx: { params?: unknown }) => Promise<Response>)(
        req as NextRequest,
        ctx
      ),

  withRoleParams:
    (_roles: string[], handler: unknown) => async (req: unknown, ctx: { params?: unknown }) =>
      (handler as (req: NextRequest, ctx: { params?: unknown }) => Promise<Response>)(
        req as NextRequest,
        ctx
      ),
}));

// Service mocks keep these tests focused on route validation and service contracts.
jest.mock("@/lib/services/sucursales", () => ({
  listSucursales: jest.fn(),
  createSucursal: jest.fn(),
  getSucursal: jest.fn(),
  updateSucursal: jest.fn(),
  deleteSucursal: jest.fn(),
}));

type RouteContext = {
  params: Promise<{ id: string }>;
};

// Minimal NextRequest mock.
// The route only needs url and json(), so we avoid unnecessary test setup.
const createMockRequest = (url: string, body?: unknown): NextRequest =>
  ({
    url,
    nextUrl: new URL(url),
    cookies: {
      get: jest.fn(),
    },
    json: async () => body,
  }) as unknown as NextRequest;

const createParams = (id: string): RouteContext => ({
  params: Promise.resolve({ id }),
});

describe("API Sucursales", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (listSucursales as jest.Mock).mockResolvedValue({
      items: [],
      total: 0,
    });

    (createSucursal as jest.Mock).mockResolvedValue({
      id_sucursal: 1,
      nombre_sucursal: "Sucursal Demo",
      direccion: "Calle 123",
      horario_apertura: null,
      horario_salida: null,
      estatus: "Activo",
    });

    (getSucursal as jest.Mock).mockResolvedValue({
      id_sucursal: 1,
      nombre_sucursal: "Sucursal Demo",
      direccion: "Calle 123",
      horario_apertura: null,
      horario_salida: null,
      estatus: "Activo",
      pedidos: [],
      colaboradores: [],
      maquinas: [],
    });

    (updateSucursal as jest.Mock).mockResolvedValue({
      id_sucursal: 1,
      nombre_sucursal: "Sucursal Actualizada",
      direccion: "Calle 456",
      horario_apertura: null,
      horario_salida: null,
      estatus: "Activo",
    });

    (deleteSucursal as jest.Mock).mockResolvedValue(undefined);
  });

  describe("GET /api/sucursales", () => {
    it("returns a paginated branch list", async () => {
      (listSucursales as jest.Mock).mockResolvedValue({
        items: [
          {
            id_sucursal: 1,
            nombre_sucursal: "Sucursal Demo",
            direccion: "Calle 123",
            estatus: "Activo",
          },
        ],
        total: 1,
      });

      const req = createMockRequest("http://localhost/api/sucursales?page=1&pageSize=10");

      const res = await GET_ALL(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.data[0].nombre_sucursal).toBe("Sucursal Demo");
      expect(body.total).toBe(1);
    });

    it("passes pagination, search, and filters to the service", async () => {
      const req = createMockRequest(
        "http://localhost/api/sucursales?page=2&pageSize=5&search=norte&nombre=sucursal&direccion=avenida&estatus=Activo&estatus=Inactivo"
      );

      const res = await GET_ALL(req);

      expect(res.status).toBe(200);
      expect(listSucursales).toHaveBeenCalledWith(2, 5, {
        search: "norte",
        nombre: "sucursal",
        direccion: "avenida",
        estatus: ["Activo", "Inactivo"],
      });
    });

    it("normalizes invalid pagination values before querying", async () => {
      const req = createMockRequest("http://localhost/api/sucursales?page=0&pageSize=999");

      const res = await GET_ALL(req);

      expect(res.status).toBe(200);
      expect(listSucursales).toHaveBeenCalledWith(1, 100, {
        search: "",
        nombre: "",
        direccion: "",
        estatus: [],
      });
    });
  });

  describe("POST /api/sucursales", () => {
    it("creates a new branch with valid data", async () => {
      const req = createMockRequest("http://localhost/api/sucursales", {
        nombre_sucursal: "Nueva Sucursal",
        direccion: "Av. Principal",
        horario_apertura: "1970-01-01T08:00:00.000Z",
        horario_salida: "1970-01-01T20:00:00.000Z",
        estatus: "Activo",
      });

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body.data.nombre_sucursal).toBe("Sucursal Demo");

      // Zod coerces schedule strings into Date objects before reaching the service.
      expect(createSucursal).toHaveBeenCalledWith(
        expect.objectContaining({
          nombre_sucursal: "Nueva Sucursal",
          direccion: "Av. Principal",
          horario_apertura: expect.any(Date),
          horario_salida: expect.any(Date),
          estatus: "Activo",
        })
      );
    });

    it("rejects creation when required fields are missing", async () => {
      const req = createMockRequest("http://localhost/api/sucursales", {
        direccion: "Av. Principal",
        estatus: "Activo",
      });

      const res = await POST(req);

      expect(res.status).toBe(422);
      expect(createSucursal).not.toHaveBeenCalled();
    });

    it("rejects creation with an unsupported status", async () => {
      const req = createMockRequest("http://localhost/api/sucursales", {
        nombre_sucursal: "Sucursal Inválida",
        direccion: "Av. Principal",
        estatus: "Archivada",
      });

      const res = await POST(req);

      expect(res.status).toBe(422);
      expect(createSucursal).not.toHaveBeenCalled();
    });
  });

  describe("GET /api/sucursales/[id]", () => {
    it("returns a branch by id", async () => {
      const req = createMockRequest("http://localhost/api/sucursales/1");

      const res = await GET(req, createParams("1"));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.data.nombre_sucursal).toBe("Sucursal Demo");
      expect(getSucursal).toHaveBeenCalledWith(1);
    });

    it("rejects invalid route params before calling the service", async () => {
      const req = createMockRequest("http://localhost/api/sucursales/abc");

      const res = await GET(req, createParams("abc"));

      expect(res.status).toBe(422);
      expect(getSucursal).not.toHaveBeenCalled();
    });
  });

  describe("PUT /api/sucursales/[id]", () => {
    it("updates a branch with valid partial data", async () => {
      const req = createMockRequest("http://localhost/api/sucursales/1", {
        nombre_sucursal: "Sucursal Actualizada",
        direccion: "Calle 456",
        estatus: "Activo",
      });

      const res = await PUT(req, createParams("1"));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.data.nombre_sucursal).toBe("Sucursal Actualizada");
      expect(updateSucursal).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          nombre_sucursal: "Sucursal Actualizada",
          direccion: "Calle 456",
          estatus: "Activo",
        })
      );
    });

    it("coerces schedule values into Date objects when updating", async () => {
      const req = createMockRequest("http://localhost/api/sucursales/1", {
        horario_apertura: "1970-01-01T09:00:00.000Z",
        horario_salida: "1970-01-01T18:00:00.000Z",
      });

      const res = await PUT(req, createParams("1"));

      expect(res.status).toBe(200);
      expect(updateSucursal).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          horario_apertura: expect.any(Date),
          horario_salida: expect.any(Date),
        })
      );
    });

    it("rejects updates with invalid status values", async () => {
      const req = createMockRequest("http://localhost/api/sucursales/1", {
        estatus: "Eliminado",
      });

      const res = await PUT(req, createParams("1"));

      expect(res.status).toBe(422);
      expect(updateSucursal).not.toHaveBeenCalled();
    });

    it("rejects invalid id params on update", async () => {
      const req = createMockRequest("http://localhost/api/sucursales/-1", {
        nombre_sucursal: "Sucursal Actualizada",
      });

      const res = await PUT(req, createParams("-1"));

      expect(res.status).toBe(422);
      expect(updateSucursal).not.toHaveBeenCalled();
    });
  });

  describe("DELETE /api/sucursales/[id]", () => {
    it("soft deletes a branch through the service", async () => {
      const req = createMockRequest("http://localhost/api/sucursales/1");

      const res = await DELETE(req, createParams("1"));

      expect(res.status).toBe(204);
      expect(deleteSucursal).toHaveBeenCalledWith(1);
    });

    it("rejects invalid id params on delete", async () => {
      const req = createMockRequest("http://localhost/api/sucursales/abc");

      const res = await DELETE(req, createParams("abc"));

      expect(res.status).toBe(422);
      expect(deleteSucursal).not.toHaveBeenCalled();
    });
  });
});
