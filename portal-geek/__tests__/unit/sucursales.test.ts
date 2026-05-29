/**
 * @jest-environment node
 */
import { prisma } from "@/lib/db/client";
import { listSucursales } from "@/lib/services/sucursales";

jest.mock("@/lib/db/client", () => ({
  prisma: {
    $transaction: jest.fn(),
    sucursales: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const mockTransaction = prisma.$transaction as jest.Mock;
const mockFindMany = prisma.sucursales.findMany as jest.Mock;
const mockCount = prisma.sucursales.count as jest.Mock;

describe("Servicio de Sucursales (Mock DB)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("listSucursales", () => {
    it("returns active and inactive branches when no status filter is supplied", async () => {
      const mockItems = [
        {
          id_sucursal: 1,
          nombre_sucursal: "Sucursal Activa",
          direccion: "Calle 123",
          horario_apertura: null,
          horario_salida: null,
          estatus: "Activo",
        },
        {
          id_sucursal: 2,
          nombre_sucursal: "Sucursal Inactiva",
          direccion: "Calle 456",
          horario_apertura: null,
          horario_salida: null,
          estatus: "Inactivo",
        },
      ];

      mockTransaction.mockResolvedValue([mockItems, 2]);

      const result = await listSucursales(1, 10, {
        search: "",
        nombre: "",
        direccion: "",
        estatus: [],
      });

      expect(result.items).toEqual(mockItems);
      expect(result.total).toBe(2);

      expect(mockFindMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        orderBy: {
          id_sucursal: "asc",
        },
        include: {
          colaboradores: { include: { usuario: true } },
          maquinas: { include: { maquina: true } },
        },
      });

      expect(mockCount).toHaveBeenCalledWith({
        where: {},
      });
    });

    it("filters branches by status when a status filter is supplied", async () => {
      const mockItems = [
        {
          id_sucursal: 1,
          nombre_sucursal: "Sucursal Activa",
          direccion: "Calle 123",
          horario_apertura: null,
          horario_salida: null,
          estatus: "Activo",
        },
      ];

      mockTransaction.mockResolvedValue([mockItems, 1]);

      const result = await listSucursales(1, 10, {
        search: "",
        nombre: "",
        direccion: "",
        estatus: ["Activo"],
      });

      expect(result.items).toEqual(mockItems);
      expect(result.total).toBe(1);

      expect(mockFindMany).toHaveBeenCalledWith({
        where: {
          AND: [
            {
              estatus: {
                in: ["Activo"],
              },
            },
          ],
        },
        skip: 0,
        take: 10,
        orderBy: {
          id_sucursal: "asc",
        },
        include: {
          colaboradores: { include: { usuario: true } },
          maquinas: { include: { maquina: true } },
        },
      });

      expect(mockCount).toHaveBeenCalledWith({
        where: {
          AND: [
            {
              estatus: {
                in: ["Activo"],
              },
            },
          ],
        },
      });
    });
  });
});
