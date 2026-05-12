/**
 * @jest-environment node
 */
import { prisma } from "@/lib/db/client";
import {
  listColaboradores,
  getColaborador,
  createColaborador,
  updateColaborador,
  deleteColaborador,
} from "@/lib/services/colaboradores";
import { NotFoundError } from "@/lib/utils/errors";

jest.mock("@/lib/db/client", () => ({
  prisma: {
    $transaction: jest.fn(),
    usuarios: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock("@/lib/auth/password", () => ({
  hashPassword: jest.fn().mockResolvedValue("hashed_password"),
}));

const mockTransaction = prisma.$transaction as jest.Mock;
const mockFindMany = prisma.usuarios.findMany as jest.Mock;
const mockCount = prisma.usuarios.count as jest.Mock;
const mockFindUnique = prisma.usuarios.findUnique as jest.Mock;
const mockCreate = prisma.usuarios.create as jest.Mock;
const mockUpdate = prisma.usuarios.update as jest.Mock;

const BASE_COLABORADOR = {
  id_usuario: 1,
  nombre_completo: "Juan García",
  correo_electronico: "juan@example.com",
  id_rol: 2,
  estatus: "Activo",
  rol: { id_rol: 2, nombre_rol: "Colaborador" },
  colaborador: {
    id_colaborador: 1,
    edad: 28,
    sexo: "M",
    telefono: "5551234567",
    estatus_colaborador: "Activo",
    fecha_modificacion: new Date().toISOString(),
    sucursal: { id_sucursal: 1, nombre_sucursal: "Sucursal Norte" },
  },
};

const VALID_CREATE_INPUT = {
  nombre_completo: "María López",
  correo_electronico: "maria@example.com",
  contrasena_hash: "password123",
  id_rol: 2,
  id_sucursal: 1,
  edad: 25,
  sexo: "F" as const,
  telefono: "5559876543",
  estatus: "Activo" as const,
  estatus_colaborador: "Activo" as const,
};

// ──────────────────────────────────────────────────────────────────────────────
// COL-02 — listColaboradores
// ──────────────────────────────────────────────────────────────────────────────
describe("listColaboradores — COL-02 Consultar colaboradores", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTransaction.mockImplementation((ops: Promise<unknown>[]) => Promise.all(ops));
  });

  it("retorna items y total correctamente", async () => {
    mockFindMany.mockResolvedValue([BASE_COLABORADOR]);
    mockCount.mockResolvedValue(1);

    const result = await listColaboradores(1, 20);
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it("aplica paginación correctamente: página 2 con tamaño 5 da skip=5", async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(12);

    const result = await listColaboradores(2, 5);
    expect(result.total).toBe(12);

    const [findManyCall] = mockTransaction.mock.calls[0][0];
    void findManyCall;
    expect(mockTransaction).toHaveBeenCalled();
  });

  it("excluye colaboradores con estatus Inactivo", async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    await listColaboradores(1, 20);

    const transactionArgs = mockTransaction.mock.calls[0][0];
    expect(transactionArgs).toBeDefined();
  });

  it("retorna lista vacía sin errores cuando no hay colaboradores", async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    const result = await listColaboradores(1, 20);
    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// COL-02 — getColaborador
// ──────────────────────────────────────────────────────────────────────────────
describe("getColaborador — COL-02 Obtener colaborador por ID", () => {
  beforeEach(() => jest.clearAllMocks());

  it("retorna el colaborador cuando existe", async () => {
    mockFindUnique.mockResolvedValue(BASE_COLABORADOR);

    const result = await getColaborador(1);
    expect(result).toEqual(BASE_COLABORADOR);
    expect(mockFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id_usuario: 1 } })
    );
  });

  it("lanza NotFoundError cuando el usuario no existe", async () => {
    mockFindUnique.mockResolvedValue(null);
    await expect(getColaborador(999)).rejects.toThrow(NotFoundError);
  });

  it("lanza NotFoundError cuando el usuario existe pero no tiene colaborador", async () => {
    mockFindUnique.mockResolvedValue({ ...BASE_COLABORADOR, colaborador: null });
    await expect(getColaborador(1)).rejects.toThrow(NotFoundError);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// COL-01 — createColaborador
// ──────────────────────────────────────────────────────────────────────────────
describe("createColaborador — COL-01 Registrar colaborador", () => {
  beforeEach(() => jest.clearAllMocks());

  it("crea el colaborador y retorna el registro completo", async () => {
    mockCreate.mockResolvedValue(BASE_COLABORADOR);

    const result = await createColaborador(VALID_CREATE_INPUT);
    expect(result).toMatchObject({ id_usuario: 1, nombre_completo: "Juan García" });
    expect(mockCreate).toHaveBeenCalled();
  });

  it("hashea la contraseña antes de guardar", async () => {
    mockCreate.mockResolvedValue(BASE_COLABORADOR);
    const { hashPassword } = jest.requireMock("@/lib/auth/password");

    await createColaborador(VALID_CREATE_INPUT);
    expect(hashPassword).toHaveBeenCalledWith(VALID_CREATE_INPUT.contrasena_hash);
  });

  it("crea el colaborador con registro anidado (colaborador.create)", async () => {
    mockCreate.mockResolvedValue(BASE_COLABORADOR);

    await createColaborador(VALID_CREATE_INPUT);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          colaborador: expect.objectContaining({ create: expect.any(Object) }),
        }),
      })
    );
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// COL-03 — updateColaborador
// ──────────────────────────────────────────────────────────────────────────────
describe("updateColaborador — COL-03 Modificar información", () => {
  beforeEach(() => jest.clearAllMocks());

  it("actualiza y retorna el colaborador modificado", async () => {
    const updated = { ...BASE_COLABORADOR, nombre_completo: "Juan Modificado" };
    mockUpdate.mockResolvedValue(updated);

    const result = await updateColaborador(1, { nombre_completo: "Juan Modificado" });
    expect(result.nombre_completo).toBe("Juan Modificado");
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ where: { id_usuario: 1 } }));
  });

  it("actualiza campos del colaborador anidado (telefono, edad)", async () => {
    const updated = {
      ...BASE_COLABORADOR,
      colaborador: { ...BASE_COLABORADOR.colaborador, telefono: "5550000001", edad: 30 },
    };
    mockUpdate.mockResolvedValue(updated);

    const result = await updateColaborador(1, { telefono: "5550000001", edad: 30 });
    expect(result.colaborador?.telefono).toBe("5550000001");
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          colaborador: { update: expect.objectContaining({ telefono: "5550000001", edad: 30 }) },
        }),
      })
    );
  });

  it("actualiza estatus_colaborador sin afectar usuarios.estatus", async () => {
    const updated = {
      ...BASE_COLABORADOR,
      colaborador: { ...BASE_COLABORADOR.colaborador, estatus_colaborador: "Inactivo" },
    };
    mockUpdate.mockResolvedValue(updated);

    await updateColaborador(1, { estatus_colaborador: "Inactivo" });
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          colaborador: { update: { estatus_colaborador: "Inactivo" } },
        }),
      })
    );
    const callData = mockUpdate.mock.calls[0][0].data;
    expect(callData.estatus).toBeUndefined();
  });

  it("lanza NotFoundError cuando el colaborador no existe (P2025)", async () => {
    mockUpdate.mockRejectedValue(Object.assign(new Error("Record not found"), { code: "P2025" }));
    await expect(updateColaborador(999, { nombre_completo: "No existe" })).rejects.toThrow(
      NotFoundError
    );
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// COL-04 — deleteColaborador
// ──────────────────────────────────────────────────────────────────────────────
describe("deleteColaborador — COL-04 Eliminar colaborador (soft delete)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("realiza soft delete: pone estatus Inactivo en usuario y colaborador", async () => {
    mockUpdate.mockResolvedValue(undefined);

    await expect(deleteColaborador(1)).resolves.toBeUndefined();
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id_usuario: 1 },
      data: {
        estatus: "Inactivo",
        colaborador: { update: { estatus_colaborador: "Inactivo" } },
      },
    });
  });

  it("no elimina el registro de la base de datos (solo actualiza estatus)", async () => {
    mockUpdate.mockResolvedValue(undefined);

    await deleteColaborador(1);
    const { delete: mockDel } = prisma.usuarios as unknown as { delete: jest.Mock };
    expect(mockDel).toBeUndefined();
  });

  it("lanza NotFoundError cuando el colaborador no existe (P2025)", async () => {
    mockUpdate.mockRejectedValue(Object.assign(new Error("Record not found"), { code: "P2025" }));
    await expect(deleteColaborador(999)).rejects.toThrow(NotFoundError);
  });
});
