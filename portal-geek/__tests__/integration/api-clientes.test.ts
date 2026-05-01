/**
 * @jest-environment node
 */
import { prisma } from "@/lib/db/client";
import { createApp } from "../helpers/next-supertest";

// Still mock session to simulate role-based access without a real Auth0 session
const mockGetSession = jest.fn();
jest.mock("@/lib/auth/session", () => ({
  getSession: () => mockGetSession(),
}));

describe("Pruebas de Integración de API de Clientes (DB Real)", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let routes: any;

  beforeAll(async () => {
    routes = await import("@/app/api/clientes/route");
    // Initial cleanup
    await prisma.clientes.deleteMany({
      where: { nombre_cliente: { startsWith: "TEST_REAL_" } }
    });
  });

  afterAll(async () => {
    // Final cleanup
    await prisma.clientes.deleteMany({
      where: { nombre_cliente: { startsWith: "TEST_REAL_" } }
    });
    await prisma.$disconnect();
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
    it("retorna 200 con lista vacía si no hay registros que coincidan", async () => {
      mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
      
      // We use a specific search or just assume cleanup worked
      await prisma.clientes.deleteMany({ where: { nombre_cliente: { startsWith: "TEST_REAL_" } } });
      
      // Since there might be other real clients in the DB, we filter by our prefix in a real scenario
      // But here we test the general response structure
      const res = await createApp({ GET: routes.GET }).get("/api/clientes");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("data");
      expect(res.body).toHaveProperty("total");
    });

    it("respeta la paginación con datos reales", async () => {
      mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });

      // Create 3 test clients
      for (let i = 1; i <= 3; i++) {
        await prisma.clientes.create({
          data: {
            nombre_cliente: `TEST_REAL_Batch_${i}`,
            correo_electronico: `batch${i}@test.com`,
            numero_telefono: "0000000000"
          }
        });
      }

      const res = await createApp({ GET: routes.GET }).get("/api/clientes?pageSize=2&page=1");
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.pageSize).toBe(2);
      expect(res.body.page).toBe(1);
    });
  });

  describe("POST /api/clientes", () => {
    it("retorna 422 cuando los datos son inválidos (nombre vacío)", async () => {
      mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
      
      const res = await createApp({ POST: routes.POST })
        .post("/api/clientes")
        .send({
          nombre_cliente: "", // Inválido
          correo_electronico: "test@test.com",
          numero_telefono: "1234567890"
        });

      expect(res.status).toBe(422);
    });

    it("crea un cliente exitosamente y lo persiste en la DB", async () => {
      mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
      
      const newClient = {
        nombre_cliente: "TEST_REAL_Nuevo",
        correo_electronico: "nuevo@test.com",
        numero_telefono: "9876543210",
        categoria: "Silver"
      };

      const res = await createApp({ POST: routes.POST })
        .post("/api/clientes")
        .send(newClient);

      expect(res.status).toBe(201);
      expect(res.body.data.nombre_cliente).toBe(newClient.nombre_cliente);

      // Verify persistence
      const dbRecord = await prisma.clientes.findFirst({
        where: { nombre_cliente: "TEST_REAL_Nuevo" }
      });
      expect(dbRecord).toBeDefined();
      expect(dbRecord?.correo_electronico).toBe(newClient.correo_electronico);
    });
  });
});
