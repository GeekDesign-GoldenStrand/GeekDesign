/**
 * @jest-environment node
 */
import { prisma } from "@/lib/db/client";

import { createApp } from "../helpers/next-supertest";

jest.mock("@/lib/db/client", () => ({
  prisma: {
    proveedores: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const mockFindUnique = prisma.proveedores.findUnique as jest.Mock;
const mockUpdate = prisma.proveedores.update as jest.Mock;

const mockGetSession = jest.fn();
jest.mock("@/lib/auth/session", () => ({
  getSession: () => mockGetSession(),
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeApp(method: "GET" | "PUT" | "DELETE", routes: Record<string, any>) {
  return createApp(routes, (url) => {
    const segments = url.pathname.split("/");
    return { id: segments[segments.length - 1] };
  });
}

const BASE_PROVEEDOR = {
  id_proveedor: 1,
  nombre_proveedor: "Proveedor SA",
  tipo: "Proveedor de material",
  telefono: "4421234567",
  correo: "proveedor@test.com",
  descripcion_proveedor: null,
  ubicacion: "Querétaro, Querétaro",
  estatus: "Activo",
};

// ──────────────────────────────────────────────────────────────────────────────
// PROV-02 – PUT /api/proveedores/[id]
// ──────────────────────────────────────────────────────────────────────────────
describe("PUT /api/proveedores/[id] — PROV-02 Modificar proveedor", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let routes: any;

  beforeAll(async () => {
    routes = await import("@/app/api/proveedores/[id]/route");
  });

  beforeEach(() => jest.clearAllMocks());

  it("retorna 401 sin sesión activa", async () => {
    mockGetSession.mockResolvedValue(null);

    const res = await makeApp("PUT", { PUT: routes.PUT })
      .put("/api/proveedores/1")
      .send({ nombre_proveedor: "Nuevo nombre" });

    expect(res.status).toBe(401);
  });

  it("retorna 403 cuando el rol no es Direccion", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Colaborador" });

    const res = await makeApp("PUT", { PUT: routes.PUT })
      .put("/api/proveedores/1")
      .send({ nombre_proveedor: "Nuevo nombre" });

    expect(res.status).toBe(403);
  });

  it("retorna 200 con los datos actualizados", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    const updated = { ...BASE_PROVEEDOR, nombre_proveedor: "Nuevo nombre" };
    mockUpdate.mockResolvedValue(updated);

    const res = await makeApp("PUT", { PUT: routes.PUT })
      .put("/api/proveedores/1")
      .send({ nombre_proveedor: "Nuevo nombre" });

    expect(res.status).toBe(200);
    expect(res.body.data.nombre_proveedor).toBe("Nuevo nombre");
  });

  it("acepta rol Administrador como equivalente a Direccion", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Administrador" });
    mockUpdate.mockResolvedValue(BASE_PROVEEDOR);

    const res = await makeApp("PUT", { PUT: routes.PUT })
      .put("/api/proveedores/1")
      .send({ nombre_proveedor: "Proveedor SA" });

    expect(res.status).toBe(200);
  });

  it("retorna 404 cuando el proveedor no existe", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    mockUpdate.mockRejectedValue({ code: "P2025" });

    const res = await makeApp("PUT", { PUT: routes.PUT })
      .put("/api/proveedores/999")
      .send({ nombre_proveedor: "No existe" });

    expect(res.status).toBe(404);
    expect(res.body.error).toContain("no encontrado");
  });

  it("retorna 422 cuando el id no es un número", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });

    const res = await makeApp("PUT", { PUT: routes.PUT })
      .put("/api/proveedores/abc")
      .send({ nombre_proveedor: "Test" });

    expect(res.status).toBe(422);
  });

  it("retorna 422 cuando nombre_proveedor excede 30 caracteres", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });

    const res = await makeApp("PUT", { PUT: routes.PUT })
      .put("/api/proveedores/1")
      .send({ nombre_proveedor: "A".repeat(31) });

    expect(res.status).toBe(422);
    expect(res.body.error).toContain("nombre_proveedor");
  });

  it("retorna 422 cuando el correo tiene formato inválido", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });

    const res = await makeApp("PUT", { PUT: routes.PUT })
      .put("/api/proveedores/1")
      .send({ correo: "no-es-un-correo" });

    expect(res.status).toBe(422);
    expect(res.body.error).toContain("correo");
  });

  it("retorna 422 cuando el tipo no es un valor permitido", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });

    const res = await makeApp("PUT", { PUT: routes.PUT })
      .put("/api/proveedores/1")
      .send({ tipo: "Tipo inválido" });

    expect(res.status).toBe(422);
    expect(res.body.error).toContain("tipo");
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// PROV-03 – DELETE /api/proveedores/[id]
// ──────────────────────────────────────────────────────────────────────────────
describe("DELETE /api/proveedores/[id] — PROV-03 Eliminar proveedor (soft delete)", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let routes: any;

  beforeAll(async () => {
    routes = await import("@/app/api/proveedores/[id]/route");
  });

  beforeEach(() => jest.clearAllMocks());

  it("retorna 401 sin sesión activa", async () => {
    mockGetSession.mockResolvedValue(null);

    const res = await makeApp("DELETE", { DELETE: routes.DELETE }).delete("/api/proveedores/1");

    expect(res.status).toBe(401);
  });

  it("retorna 403 cuando el rol no es Direccion", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Colaborador" });

    const res = await makeApp("DELETE", { DELETE: routes.DELETE }).delete("/api/proveedores/1");

    expect(res.status).toBe(403);
  });

  it("retorna 204 y llama update con estatus Inactivo", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    mockUpdate.mockResolvedValue({ ...BASE_PROVEEDOR, estatus: "Inactivo" });

    const res = await makeApp("DELETE", { DELETE: routes.DELETE }).delete("/api/proveedores/1");

    expect(res.status).toBe(204);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id_proveedor: 1 },
        data: { estatus: "Inactivo" },
      })
    );
  });

  it("acepta rol Administrador como equivalente a Direccion", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Administrador" });
    mockUpdate.mockResolvedValue({ ...BASE_PROVEEDOR, estatus: "Inactivo" });

    const res = await makeApp("DELETE", { DELETE: routes.DELETE }).delete("/api/proveedores/1");

    expect(res.status).toBe(204);
  });

  it("retorna 404 cuando el proveedor no existe", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    mockUpdate.mockRejectedValue({ code: "P2025" });

    const res = await makeApp("DELETE", { DELETE: routes.DELETE }).delete("/api/proveedores/999");

    expect(res.status).toBe(404);
    expect(res.body.error).toContain("no encontrado");
  });

  it("retorna 422 cuando el id no es un número", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });

    const res = await makeApp("DELETE", { DELETE: routes.DELETE }).delete("/api/proveedores/abc");

    expect(res.status).toBe(422);
  });
});
