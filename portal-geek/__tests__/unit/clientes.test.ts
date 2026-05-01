/**
 * @jest-environment node
 */
import { prisma } from "@/lib/db/client";
import { 
  listClientes, 
  getCliente, 
  createCliente, 
  updateCliente, 
  deleteCliente 
} from "@/lib/services/clientes";
import { NotFoundError } from "@/lib/utils/errors";

describe("Servicio de Clientes (DB Real)", () => {
  beforeAll(async () => {
    // Initial cleanup
    await prisma.clientes.deleteMany({
      where: { nombre_cliente: { startsWith: "TEST_SVC_" } }
    });
  });

  afterAll(async () => {
    // Final cleanup
    await prisma.clientes.deleteMany({
      where: { nombre_cliente: { startsWith: "TEST_SVC_" } }
    });
    await prisma.$disconnect();
  });

  describe("createCliente y getCliente", () => {
    it("debe crear un cliente y luego recuperarlo por ID", async () => {
      const data = {
        nombre_cliente: "TEST_SVC_Read",
        correo_electronico: "read@test.com",
        numero_telefono: "1112223333",
        categoria: "Black"
      };

      const created = await createCliente(data as any);
      expect(created.id_cliente).toBeDefined();

      const retrieved = await getCliente(created.id_cliente);
      expect(retrieved.nombre_cliente).toBe(data.nombre_cliente);
      expect(retrieved.categoria).toBe("Black");
    });

    it("debe lanzar NotFoundError para un ID inexistente", async () => {
      await expect(getCliente(999999)).rejects.toThrow(NotFoundError);
    });
  });

  describe("listClientes", () => {
    it("debe paginar correctamente y devolver el total real", async () => {
      // Seed specific data
      const prefix = "TEST_SVC_List_";
      await prisma.clientes.deleteMany({ where: { nombre_cliente: { startsWith: prefix } } });
      
      for (let i = 1; i <= 5; i++) {
        await createCliente({
          nombre_cliente: `${prefix}${i}`,
          correo_electronico: `list${i}@test.com`,
          numero_telefono: "000"
        } as any);
      }

      const pageSize = 2;
      const page1 = await listClientes(1, pageSize);
      expect(page1.items.length).toBe(pageSize);
      expect(page1.total).toBeGreaterThanOrEqual(5);

      const page2 = await listClientes(2, pageSize);
      expect(page2.items.length).toBe(pageSize);
      expect(page2.items[0].id_cliente).not.toBe(page1.items[0].id_cliente);
    });
  });

  describe("updateCliente", () => {
    it("debe actualizar campos específicos de un cliente", async () => {
      const created = await createCliente({
        nombre_cliente: "TEST_SVC_Before",
        correo_electronico: "before@test.com",
        numero_telefono: "000"
      } as any);

      const updated = await updateCliente(created.id_cliente, { 
        nombre_cliente: "TEST_SVC_After",
        categoria: "Baneado"
      });

      expect(updated.nombre_cliente).toBe("TEST_SVC_After");
      expect(updated.categoria).toBe("Baneado");
      expect(updated.correo_electronico).toBe("before@test.com"); // Remains same
    });

    it("debe lanzar NotFoundError al intentar actualizar uno inexistente", async () => {
      await expect(updateCliente(999999, { nombre_cliente: "Fail" })).rejects.toThrow(NotFoundError);
    });
  });

  describe("deleteCliente", () => {
    it("debe eliminar un cliente y confirmar que ya no existe", async () => {
      const created = await createCliente({
        nombre_cliente: "TEST_SVC_Delete",
        correo_electronico: "delete@test.com",
        numero_telefono: "000"
      } as any);

      await deleteCliente(created.id_cliente);

      await expect(getCliente(created.id_cliente)).rejects.toThrow(NotFoundError);
    });
  });
});
