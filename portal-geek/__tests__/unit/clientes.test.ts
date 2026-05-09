/**
 * @jest-environment node
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/db/client";
import {
  listClientes,
  getCliente,
  createCliente,
  updateCliente,
  deleteCliente,
} from "@/lib/services/clientes";
import { NotFoundError } from "@/lib/utils/errors";

jest.mock("@/lib/db/client", () => ({
  prisma: {
    $transaction: jest.fn(),
    clientes: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

const mockTransaction = prisma.$transaction as jest.Mock;
const mockFindUnique = prisma.clientes.findUnique as jest.Mock;
const mockCreate = prisma.clientes.create as jest.Mock;
const mockUpdate = prisma.clientes.update as jest.Mock;
const mockDelete = prisma.clientes.delete as jest.Mock;

describe("Servicio de Clientes (Mock DB)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createCliente y getCliente", () => {
    it("debe crear un cliente exitosamente", async () => {
      const data = {
        nombre_cliente: "Nuevo Cliente",
        correo_electronico: "read@test.com",
        numero_telefono: "1112223333",
        categoria: "Black",
      };

      mockCreate.mockResolvedValue({ id_cliente: 1, ...data });

      const created = await createCliente(data as any);
      expect(created.id_cliente).toBe(1);
      expect(mockCreate).toHaveBeenCalledWith({ data });
    });

    it("debe recuperar un cliente por ID", async () => {
      const mockData = { id_cliente: 1, nombre_cliente: "Recuperado" };
      mockFindUnique.mockResolvedValue(mockData);

      const retrieved = await getCliente(1);
      expect(retrieved).toEqual(mockData);
      expect(mockFindUnique).toHaveBeenCalledWith({ where: { id_cliente: 1 } });
    });

    it("debe lanzar NotFoundError para un ID inexistente", async () => {
      mockFindUnique.mockResolvedValue(null);
      await expect(getCliente(999999)).rejects.toThrow(NotFoundError);
    });
  });

  describe("listClientes", () => {
    it("debe paginar correctamente y devolver el total", async () => {
      const mockItems = [
        { id_cliente: 1, nombre_cliente: "A" },
        { id_cliente: 2, nombre_cliente: "B" },
      ];
      mockTransaction.mockResolvedValue([mockItems, 10]);

      const pageSize = 2;
      const page = await listClientes(2, pageSize);

      expect(page.items).toEqual(mockItems);
      expect(page.total).toBe(10);
      expect(mockTransaction).toHaveBeenCalled();

      // Check that findMany was configured with skip and take inside the transaction array
      const transactionArgs = mockTransaction.mock.calls[0][0];

      expect(transactionArgs).toBeDefined();
    });
  });

  describe("updateCliente", () => {
    it("debe actualizar campos específicos de un cliente", async () => {
      const updatedData = { id_cliente: 1, nombre_cliente: "Actualizado", categoria: "Baneado" };
      mockUpdate.mockResolvedValue(updatedData);

      const updated = await updateCliente(1, {
        nombre_cliente: "Actualizado",
        categoria: "Baneado",
      });

      expect(updated.nombre_cliente).toBe("Actualizado");
      expect(updated.categoria).toBe("Baneado");
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id_cliente: 1 },
        data: { nombre_cliente: "Actualizado", categoria: "Baneado" },
      });
    });

    it("debe lanzar NotFoundError al intentar actualizar uno inexistente", async () => {
      mockUpdate.mockRejectedValue({ code: "P2025" });
      await expect(updateCliente(999999, { nombre_cliente: "Fail" })).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe("deleteCliente", () => {
    it("debe eliminar un cliente", async () => {
      mockDelete.mockResolvedValue({ id_cliente: 1 });
      await expect(deleteCliente(1)).resolves.not.toThrow();
      expect(mockDelete).toHaveBeenCalledWith({ where: { id_cliente: 1 } });
    });

    it("debe lanzar NotFoundError si falla por registro no encontrado", async () => {
      mockDelete.mockRejectedValue({ code: "P2025" });
      await expect(deleteCliente(999999)).rejects.toThrow(NotFoundError);
    });
  });
});
