/**
 * @jest-environment node
 */
import { prisma } from "@/lib/db/client";
import { getProviderAssignments, syncProviderAssignments } from "@/lib/services/proveedores";

jest.mock("@/lib/db/client", () => ({
  prisma: {
    proveedorPrecios: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
    proveedores: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn((ops) => Promise.all(ops)),
  },
}));

const mockFindMany = prisma.proveedorPrecios.findMany as jest.Mock;
const mockDeleteMany = prisma.proveedorPrecios.deleteMany as jest.Mock;
const mockCreate = prisma.proveedorPrecios.create as jest.Mock;
const mockFindUniqueProveedor = prisma.proveedores.findUnique as jest.Mock;
const mockTransaction = prisma.$transaction as jest.Mock;

describe("getProviderAssignments", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("retorna serviceIds y materialIds correctamente mapeados", async () => {
    mockFindUniqueProveedor.mockResolvedValue({ id_proveedor: 1 });
    mockFindMany.mockResolvedValue([
      { id_servicio: 1, id_material: null },
      { id_servicio: null, id_material: 10 },
      { id_servicio: 2, id_material: null },
    ]);

    const result = await getProviderAssignments(1);

    expect(result.serviceIds).toEqual([1, 2]);
    expect(result.materialIds).toEqual([10]);
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id_proveedor: 1 } })
    );
  });

  it("retorna arreglos vacíos cuando no hay asignaciones", async () => {
    mockFindUniqueProveedor.mockResolvedValue({ id_proveedor: 999 });
    mockFindMany.mockResolvedValue([]);

    const result = await getProviderAssignments(999);

    expect(result.serviceIds).toEqual([]);
    expect(result.materialIds).toEqual([]);
  });

  it("lanza NotFoundError si el proveedor no existe", async () => {
    mockFindUniqueProveedor.mockResolvedValue(null);
    await expect(getProviderAssignments(123)).rejects.toThrow("Proveedor 123 no encontrado");
  });
});

describe("syncProviderAssignments", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("agrega nuevas asignaciones de servicios", async () => {
    // Scenario: Provider has no assigned services, we want to add ID 5
    mockFindUniqueProveedor.mockResolvedValue({ id_proveedor: 1 });
    mockFindMany.mockResolvedValue([]);

    await syncProviderAssignments(1, "servicio", [5]);

    // Should create a record for service 5
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          id_proveedor: 1,
          id_servicio: 5,
          id_material: null,
        }),
      })
    );
    expect(mockTransaction).toHaveBeenCalled();
  });

  it("elimina asignaciones que ya no están en la lista", async () => {
    // Scenario: Provider has material 10, we want them to have only 20 now
    mockFindUniqueProveedor.mockResolvedValue({ id_proveedor: 1 });
    mockFindMany.mockResolvedValue([
      { id_proveedor_precio: 100, id_material: 10, id_servicio: null },
    ]);

    await syncProviderAssignments(1, "material", [20]);

    // Should remove record 100 (corresponding to material 10)
    expect(mockDeleteMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id_proveedor_precio: { in: [100] } },
      })
    );
    // Should create a record for material 20
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          id_material: 20,
        }),
      })
    );
  });

  it("no hace nada si la lista es idéntica", async () => {
    mockFindUniqueProveedor.mockResolvedValue({ id_proveedor: 1 });
    mockFindMany.mockResolvedValue([
      { id_proveedor_precio: 100, id_servicio: 1, id_material: null },
    ]);

    await syncProviderAssignments(1, "servicio", [1]);

    expect(mockDeleteMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id_proveedor_precio: { in: [] } } })
    );
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("lanza NotFoundError si el proveedor no existe al sincronizar", async () => {
    mockFindUniqueProveedor.mockResolvedValue(null);
    await expect(syncProviderAssignments(123, "servicio", [1])).rejects.toThrow(
      "Proveedor 123 no encontrado"
    );
  });

  it("elimina todas las asignaciones si el arreglo de IDs está vacío", async () => {
    mockFindUniqueProveedor.mockResolvedValue({ id_proveedor: 1 });
    mockFindMany.mockResolvedValue([
      { id_proveedor_precio: 100, id_servicio: 1, id_material: null },
      { id_proveedor_precio: 101, id_servicio: 2, id_material: null },
    ]);

    await syncProviderAssignments(1, "servicio", []);

    expect(mockDeleteMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id_proveedor_precio: { in: [100, 101] } } })
    );
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("lanza un error si la transacción falla", async () => {
    mockFindUniqueProveedor.mockResolvedValue({ id_proveedor: 1 });
    mockFindMany.mockResolvedValue([]);
    mockTransaction.mockRejectedValue(new Error("Transaction failed"));

    await expect(syncProviderAssignments(1, "servicio", [5])).rejects.toThrow(
      "Transaction failed"
    );
  });
});
