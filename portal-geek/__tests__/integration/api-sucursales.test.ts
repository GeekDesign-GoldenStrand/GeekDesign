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

// Mock services
jest.mock("@/lib/services/sucursales", () => ({
  listSucursales: jest.fn(),
  createSucursal: jest.fn(),
  getSucursal: jest.fn(),
  updateSucursal: jest.fn(),
  deleteSucursal: jest.fn(),
}));

// Minimal mock of NextRequest
const createMockRequest = (url: string, body?: unknown): NextRequest =>
  ({
    url,
    nextUrl: new URL(url),
    cookies: {
      get: jest.fn(),
    },
    json: async () => body,
  }) as unknown as NextRequest;

describe("API Sucursales", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GET /api/sucursales returns paginated list", async () => {
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
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data[0].nombre_sucursal).toBe("Sucursal Demo");
  });

  it("POST /api/sucursales creates a new sucursal", async () => {
    (createSucursal as jest.Mock).mockResolvedValue({
      id_sucursal: 2,
      nombre_sucursal: "Nueva Sucursal",
      direccion: "Av. Principal",
      estatus: "Activo",
    });

    const req = createMockRequest("http://localhost/api/sucursales", {
      nombre_sucursal: "Nueva Sucursal",
      direccion: "Av. Principal",
      estatus: "Activo",
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.nombre_sucursal).toBe("Nueva Sucursal");
  });

  it("GET /api/sucursales/[id] returns sucursal by id", async () => {
    (getSucursal as jest.Mock).mockResolvedValue({
      id_sucursal: 1,
      nombre_sucursal: "Sucursal Demo",
      direccion: "Calle 123",
      estatus: "Activo",
    });

    const req = createMockRequest("http://localhost/api/sucursales/1");
    const res = await GET(req, { params: Promise.resolve({ id: "1" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.nombre_sucursal).toBe("Sucursal Demo");
  });

  it("PUT /api/sucursales/[id] updates sucursal", async () => {
    (updateSucursal as jest.Mock).mockResolvedValue({
      id_sucursal: 1,
      nombre_sucursal: "Sucursal Actualizada",
      direccion: "Calle 456",
      estatus: "Activo",
    });

    const req = createMockRequest("http://localhost/api/sucursales/1", {
      nombre_sucursal: "Sucursal Actualizada",
      direccion: "Calle 456",
    });
    const res = await PUT(req, { params: Promise.resolve({ id: "1" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.nombre_sucursal).toBe("Sucursal Actualizada");
  });

  it("DELETE /api/sucursales/[id] removes sucursal", async () => {
    (deleteSucursal as jest.Mock).mockResolvedValue(undefined);

    const req = createMockRequest("http://localhost/api/sucursales/1");
    const res = await DELETE(req, { params: Promise.resolve({ id: "1" }) });
    expect(res.status).toBe(204);
  });
});
