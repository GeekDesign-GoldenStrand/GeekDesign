/**
 * @jest-environment node
 */
import { prisma } from "@/lib/db/client";
import {
  listMaquinas,
  createMaquina,
  updateMaquina,
  deleteMaquina,
  asignarSucursal,
} from "@/lib/services/maquinas";
import { NotFoundError } from "@/lib/utils/errors";

jest.mock("@/lib/db/client", () => ({
  prisma: {
    $transaction: jest.fn(),
    maquinas: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    sucursalesMaquina: {
      upsert: jest.fn(), // ✅ replaced findFirst, create, update
    },
  },
}));

const mockTransaction = prisma.$transaction as jest.Mock;
const mockFindMany = prisma.maquinas.findMany as jest.Mock;
const mockCount = prisma.maquinas.count as jest.Mock;
const mockFindUnique = prisma.maquinas.findUnique as jest.Mock;
const mockCreate = prisma.maquinas.create as jest.Mock;
const mockUpdate = prisma.maquinas.update as jest.Mock;
const mockSucursalUpsert = prisma.sucursalesMaquina.upsert as jest.Mock; // ✅

const MAQUINA = {
  id_maquina: 1,
  nombre_maquina: "CO2 100 Watts",
  apodo_maquina: "Cardenal",
  tipo: "Láser CO2",
  descripcion: "Área de trabajo 60x90cm",
  estatus: "Activa",
  fecha_registro: new Date().toISOString(),
  sucursales: [{ sucursal: { nombre_sucursal: "Sucursal Norte" } }],
  servicios: [{ servicio: { nombre_servicio: "Corte Láser" } }],
};

const CREATE_INPUT = {
  nombre_maquina: "CO2 100 Watts",
  apodo_maquina: "Cardenal",
  tipo: "Láser CO2" as const,
  descripcion: "Área de trabajo 60x90cm",
  estatus: "Activa" as const,
};

// ---------------------------------------------------------------------------
// listMaquinas — Ver Máquinas
// ---------------------------------------------------------------------------
describe("listMaquinas", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTransaction.mockImplementation((ops: Promise<unknown>[]) => Promise.all(ops));
  });

  it("retorna items y total correctamente", async () => {
    mockFindMany.mockResolvedValue([MAQUINA]);
    mockCount.mockResolvedValue(1);

    const result = await listMaquinas(1, 20);
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it("aplica paginación correctamente en página 1", async () => {
    mockFindMany.mockResolvedValue([MAQUINA]);
    mockCount.mockResolvedValue(1);

    await listMaquinas(1, 20);
    expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 0, take: 20 }));
  });

  it("aplica paginación correctamente en página 2", async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(25);

    const result = await listMaquinas(2, 10);
    expect(result.total).toBe(25);
    expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 10, take: 10 }));
  });

  it("retorna lista vacía cuando no hay máquinas", async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    const result = await listMaquinas(1, 20);
    expect(result.items).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it("excluye máquinas con estatus Inactiva (soft delete)", async () => {
    mockFindMany.mockResolvedValue([MAQUINA]);
    mockCount.mockResolvedValue(1);

    await listMaquinas(1, 20);

    const expectedWhere = { estatus: { not: "Inactiva" } };
    expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({ where: expectedWhere }));
  });

  it("incluye sucursales y servicios en la respuesta", async () => {
    mockFindMany.mockResolvedValue([MAQUINA]);
    mockCount.mockResolvedValue(1);

    await listMaquinas(1, 20);

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          sucursales: expect.any(Object),
          servicios: expect.any(Object),
        }),
      })
    );
  });
});

// ---------------------------------------------------------------------------
// createMaquina — Registrar Máquina
// ---------------------------------------------------------------------------
describe("createMaquina", () => {
  beforeEach(() => jest.clearAllMocks());

  it("retorna la máquina creada", async () => {
    mockCreate.mockResolvedValue(MAQUINA);

    const result = await createMaquina(CREATE_INPUT);
    expect(result).toEqual(MAQUINA);
  });

  it("llama a prisma.create con los datos correctos", async () => {
    mockCreate.mockResolvedValue(MAQUINA);

    await createMaquina(CREATE_INPUT);

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          nombre_maquina: "CO2 100 Watts",
          apodo_maquina: "Cardenal",
          tipo: "Láser CO2",
          estatus: "Activa",
        }),
      })
    );
  });

  it("asigna estatus 'Activa' por defecto", async () => {
    mockCreate.mockResolvedValue(MAQUINA);

    await createMaquina(CREATE_INPUT);

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ estatus: "Activa" }),
      })
    );
  });

  it("incluye descripcion como null si no se proporciona", async () => {
    const inputSinDescripcion = { ...CREATE_INPUT, descripcion: undefined };
    mockCreate.mockResolvedValue({ ...MAQUINA, descripcion: null });

    await createMaquina(inputSinDescripcion);

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ descripcion: null }),
      })
    );
  });

  it("incluye sucursales y servicios en la respuesta", async () => {
    mockCreate.mockResolvedValue(MAQUINA);

    await createMaquina(CREATE_INPUT);

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          sucursales: expect.any(Object),
          servicios: expect.any(Object),
        }),
      })
    );
  });
});

// ---------------------------------------------------------------------------
// updateMaquina — Editar Máquina
// ---------------------------------------------------------------------------
describe("updateMaquina", () => {
  beforeEach(() => jest.clearAllMocks());

  it("retorna el registro actualizado", async () => {
    const updated = { ...MAQUINA, nombre_maquina: "CO2 150 Watts" };
    mockUpdate.mockResolvedValue(updated);

    const result = await updateMaquina(1, { nombre_maquina: "CO2 150 Watts" });
    expect(result.nombre_maquina).toBe("CO2 150 Watts");
  });

  it("actualiza solo los campos proporcionados", async () => {
    const updated = { ...MAQUINA, apodo_maquina: "Aguila" };
    mockUpdate.mockResolvedValue(updated);

    const result = await updateMaquina(1, { apodo_maquina: "Aguila" });
    expect(result.apodo_maquina).toBe("Aguila");
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { apodo_maquina: "Aguila" } })
    );
  });

  it("llama a prisma.update con el id correcto", async () => {
    mockUpdate.mockResolvedValue(MAQUINA);

    await updateMaquina(1, { nombre_maquina: "Test" });

    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ where: { id_maquina: 1 } }));
  });

  it("lanza NotFoundError cuando la máquina no existe (P2025)", async () => {
    mockUpdate.mockRejectedValue({ code: "P2025" });
    await expect(updateMaquina(999, { nombre_maquina: "No existe" })).rejects.toThrow(
      NotFoundError
    );
  });

  it("propaga errores distintos a P2025", async () => {
    mockUpdate.mockRejectedValue(new Error("Error de base de datos"));
    await expect(updateMaquina(1, { nombre_maquina: "Test" })).rejects.toThrow(
      "Error de base de datos"
    );
  });
});

// ---------------------------------------------------------------------------
// asignarSucursal — Asignar Sucursal
// ---------------------------------------------------------------------------
describe("asignarSucursal", () => {
  beforeEach(() => jest.clearAllMocks());

  it("llama a upsert con los argumentos correctos", async () => {
    mockSucursalUpsert.mockResolvedValue({});
    mockFindUnique.mockResolvedValue(MAQUINA);

    await asignarSucursal(1, 2);

    expect(mockSucursalUpsert).toHaveBeenCalledWith({
      where: { id_maquina: 1 },
      update: { id_sucursal: 2 },
      create: { id_maquina: 1, id_sucursal: 2 },
    });
  });

  it("retorna la máquina actualizada con sucursales", async () => {
    mockSucursalUpsert.mockResolvedValue({});
    mockFindUnique.mockResolvedValue(MAQUINA);

    const result = await asignarSucursal(1, 1);
    expect(result).toEqual(MAQUINA);
  });

  it("lanza NotFoundError si la máquina no existe", async () => {
    mockSucursalUpsert.mockResolvedValue({});
    mockFindUnique.mockResolvedValue(null);

    await expect(asignarSucursal(999, 1)).rejects.toThrow(NotFoundError);
  });

  it("no llama a findFirst, create ni update por separado", async () => {
    mockSucursalUpsert.mockResolvedValue({});
    mockFindUnique.mockResolvedValue(MAQUINA);

    await asignarSucursal(1, 2);

    expect(mockSucursalUpsert).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// deleteMaquina — Eliminar Máquina (Soft Delete)
// ---------------------------------------------------------------------------
describe("deleteMaquina", () => {
  beforeEach(() => jest.clearAllMocks());

  it("hace soft delete: llama update con estatus Inactiva", async () => {
    mockUpdate.mockResolvedValue({ ...MAQUINA, estatus: "Inactiva" });

    await deleteMaquina(1);

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id_maquina: 1 },
      data: { estatus: "Inactiva" },
    });
  });

  it("no elimina el registro de la base de datos", async () => {
    mockUpdate.mockResolvedValue({ ...MAQUINA, estatus: "Inactiva" });

    await deleteMaquina(1);

    expect(prisma.maquinas.findUnique).not.toHaveBeenCalled();
  });

  it("lanza NotFoundError cuando la máquina no existe (P2025)", async () => {
    mockUpdate.mockRejectedValue({ code: "P2025" });
    await expect(deleteMaquina(999)).rejects.toThrow(NotFoundError);
  });

  it("el mensaje de NotFoundError incluye el id", async () => {
    mockUpdate.mockRejectedValue({ code: "P2025" });
    await expect(deleteMaquina(42)).rejects.toThrow("42");
  });

  it("propaga errores distintos a P2025", async () => {
    mockUpdate.mockRejectedValue(new Error("Error de base de datos"));
    await expect(deleteMaquina(1)).rejects.toThrow("Error de base de datos");
  });
});
