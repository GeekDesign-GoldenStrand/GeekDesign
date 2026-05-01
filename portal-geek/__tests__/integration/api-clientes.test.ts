/**
 * @jest-environment node
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/db/client";

import { createApp } from "../helpers/next-supertest";

jest.mock("@/lib/db/client", () => ({
  prisma: {
    $transaction: jest.fn(),
    clientes: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}));

const mockTransaction = prisma.$transaction as jest.Mock;
const mockCreate = prisma.clientes.create as jest.Mock;

const mockGetSession = jest.fn();
jest.mock("@/lib/auth/session", () => ({
  getSession: () => mockGetSession(),
}));

describe("Pruebas de Integración de API de Clientes (Mock DB)", () => {
  let routes: any;

  beforeAll(async () => {
    routes = await import("@/app/api/clientes/route");
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Seguridad y Autorización", () => {
    it("retorna 401 cuando no hay sesión activa", async () => {
      mockGetSession.mockResolvedValue(null);
      const res = await createApp({ GET: routes.GET }).get("/api/clientes");
      expect(res.status).toBe(401);
    });

    it("retorna 403 cuando el usuario no es Dirección", async () => {
      mockGetSession.mockResolvedValue({ id: 1, role: "Colaborador" });
      const res = await createApp({ GET: routes.GET }).get("/api/clientes");
      expect(res.status).toBe(403);
    });
  });

  describe("GET /api/clientes", () => {
    it("retorna 200 con lista vacía si no hay registros", async () => {
      mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
      mockTransaction.mockResolvedValue([[], 0]);

      const res = await createApp({ GET: routes.GET }).get("/api/clientes");
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
      expect(res.body.total).toBe(0);
    });

    it("respeta la paginación", async () => {
      mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
      mockTransaction.mockResolvedValue([
        [
          { id_cliente: 1, nombre_cliente: "Cliente 1" },
          { id_cliente: 2, nombre_cliente: "Cliente 2" },
        ],
        5,
      ]);

      const res = await createApp({ GET: routes.GET }).get("/api/clientes?pageSize=2&page=2");
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.pageSize).toBe(2);
      expect(res.body.page).toBe(2);
      expect(res.body.total).toBe(5);
    });
  });

  describe("POST /api/clientes", () => {
    it("retorna 422 cuando los datos son inválidos (nombre vacío)", async () => {
      mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });

      const res = await createApp({ POST: routes.POST }).post("/api/clientes").send({
        nombre_cliente: "",
        correo_electronico: "test@test.com",
        numero_telefono: "1234567890",
      });

      expect(res.status).toBe(422);
    });

    it("crea un cliente exitosamente", async () => {
      mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });

      const newClient = {
        nombre_cliente: "Nuevo",
        correo_electronico: "nuevo@test.com",
        numero_telefono: "9876543210",
        categoria: "Silver",
      };

      mockCreate.mockResolvedValue({ id_cliente: 1, ...newClient });

      const res = await createApp({ POST: routes.POST }).post("/api/clientes").send(newClient);

      expect(res.status).toBe(201);
      expect(res.body.data.nombre_cliente).toBe(newClient.nombre_cliente);
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining(newClient) })
      );
    });
  });
});
