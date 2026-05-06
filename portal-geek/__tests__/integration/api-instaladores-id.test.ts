/**
 * @jest-environment node
 */
import { prisma } from "@/lib/db/client";

import { createApp } from "../helpers/next-supertest";

jest.mock("@/lib/db/client", () => ({
  prisma: {
    instaladores: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const mockUpdate = prisma.instaladores.update as jest.Mock;

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

const BASE_INSTALADOR = {
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

// ──────────────────────────────────────────────────────────────────────────────
// INST-02 – PUT /api/instaladores/[id]
// ──────────────────────────────────────────────────────────────────────────────
describe("PUT /api/instaladores/[id] — INST-02 Modificar instalador", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let routes: any;

  beforeAll(async () => {
    routes = await import("@/app/api/instaladores/[id]/route");
  });

  beforeEach(() => jest.clearAllMocks());

  it("retorna 401 sin sesión activa", async () => {
    mockGetSession.mockResolvedValue(null);

    const res = await makeApp("PUT", { PUT: routes.PUT })
      .put("/api/instaladores/1")
      .send({ nombre_instalador: "Nuevo nombre" });

    expect(res.status).toBe(401);
  });

  it("retorna 403 cuando el rol no es Direccion", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Colaborador" });

    const res = await makeApp("PUT", { PUT: routes.PUT })
      .put("/api/instaladores/1")
      .send({ nombre_instalador: "Nuevo nombre" });

    expect(res.status).toBe(403);
  });

  it("retorna 200 con los datos actualizados", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    mockUpdate.mockResolvedValue({ ...BASE_INSTALADOR, nombre_instalador: "Nuevo nombre" });

    const res = await makeApp("PUT", { PUT: routes.PUT })
      .put("/api/instaladores/1")
      .send({ nombre_instalador: "Nuevo nombre" });

    expect(res.status).toBe(200);
    expect(res.body.data.nombre_instalador).toBe("Nuevo nombre");
  });

  it("acepta rol Administrador como equivalente a Direccion", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Administrador" });
    mockUpdate.mockResolvedValue(BASE_INSTALADOR);

    const res = await makeApp("PUT", { PUT: routes.PUT })
      .put("/api/instaladores/1")
      .send({ nombre_instalador: "Juan Pérez" });

    expect(res.status).toBe(200);
  });

  it("retorna 404 cuando el instalador no existe", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    mockUpdate.mockRejectedValue({ code: "P2025" });

    const res = await makeApp("PUT", { PUT: routes.PUT })
      .put("/api/instaladores/999")
      .send({ nombre_instalador: "No existe" });

    expect(res.status).toBe(404);
    expect(res.body.error).toContain("no encontrado");
  });

  it("retorna 422 cuando el id no es un número", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });

    const res = await makeApp("PUT", { PUT: routes.PUT })
      .put("/api/instaladores/abc")
      .send({ nombre_instalador: "Test" });

    expect(res.status).toBe(422);
  });

  it("retorna 422 cuando nombre_instalador excede 30 caracteres", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });

    const res = await makeApp("PUT", { PUT: routes.PUT })
      .put("/api/instaladores/1")
      .send({ nombre_instalador: "A".repeat(31) });

    expect(res.status).toBe(422);
    expect(res.body.error).toContain("nombre_instalador");
  });

  it("retorna 422 cuando el correo tiene formato inválido", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });

    const res = await makeApp("PUT", { PUT: routes.PUT })
      .put("/api/instaladores/1")
      .send({ correo: "no-es-un-correo" });

    expect(res.status).toBe(422);
    expect(res.body.error).toContain("correo");
  });

  it("retorna 422 cuando el tipo no es un valor permitido", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });

    const res = await makeApp("PUT", { PUT: routes.PUT })
      .put("/api/instaladores/1")
      .send({ tipo: "Tipo inválido" });

    expect(res.status).toBe(422);
    expect(res.body.error).toContain("tipo");
  });

  it("retorna 422 cuando el teléfono no tiene 10 dígitos", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });

    const res = await makeApp("PUT", { PUT: routes.PUT })
      .put("/api/instaladores/1")
      .send({ telefono: "12345" });

    expect(res.status).toBe(422);
    expect(res.body.error).toContain("telefono");
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// INST-03 – DELETE /api/instaladores/[id]
// ──────────────────────────────────────────────────────────────────────────────
describe("DELETE /api/instaladores/[id] — INST-03 Eliminar instalador (soft delete)", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let routes: any;

  beforeAll(async () => {
    routes = await import("@/app/api/instaladores/[id]/route");
  });

  beforeEach(() => jest.clearAllMocks());

  it("retorna 401 sin sesión activa", async () => {
    mockGetSession.mockResolvedValue(null);

    const res = await makeApp("DELETE", { DELETE: routes.DELETE }).delete("/api/instaladores/1");

    expect(res.status).toBe(401);
  });

  it("retorna 403 cuando el rol no es Direccion", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Colaborador" });

    const res = await makeApp("DELETE", { DELETE: routes.DELETE }).delete("/api/instaladores/1");

    expect(res.status).toBe(403);
  });

  it("retorna 204 y llama update con estatus Inactivo", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    mockUpdate.mockResolvedValue({ ...BASE_INSTALADOR, estatus: "Inactivo" });

    const res = await makeApp("DELETE", { DELETE: routes.DELETE }).delete("/api/instaladores/1");

    expect(res.status).toBe(204);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id_instalador: 1 },
        data: { estatus: "Inactivo" },
      })
    );
  });

  it("acepta rol Administrador como equivalente a Direccion", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Administrador" });
    mockUpdate.mockResolvedValue({ ...BASE_INSTALADOR, estatus: "Inactivo" });

    const res = await makeApp("DELETE", { DELETE: routes.DELETE }).delete("/api/instaladores/1");

    expect(res.status).toBe(204);
  });

  it("retorna 404 cuando el instalador no existe", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
    mockUpdate.mockRejectedValue({ code: "P2025" });

    const res = await makeApp("DELETE", { DELETE: routes.DELETE }).delete("/api/instaladores/999");

    expect(res.status).toBe(404);
    expect(res.body.error).toContain("no encontrado");
  });

  it("retorna 422 cuando el id no es un número", async () => {
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });

    const res = await makeApp("DELETE", { DELETE: routes.DELETE }).delete("/api/instaladores/abc");

    expect(res.status).toBe(422);
  });
});
