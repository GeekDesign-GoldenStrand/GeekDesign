/**
 * @jest-environment node
 */
import { prisma } from "@/lib/db/client";
import { updateUsuario } from "@/lib/services/usuarios";
import { NotFoundError } from "@/lib/utils/errors";

jest.mock("@/lib/db/client", () => ({
  prisma: {
    usuarios: {
      update: jest.fn(),
    },
  },
}));

jest.mock("@/lib/auth/password", () => ({
  hashPassword: jest.fn(),
}));

const mockUpdate = prisma.usuarios.update as jest.Mock;

describe("updateUsuario (AU-04 — modificar rol)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("AU04-U1: actualiza el rol y devuelve el usuario con su rol", async () => {
    const updated = {
      id_usuario: 5,
      nombre_completo: "Ada Lovelace",
      id_rol: 2,
      rol: { id_rol: 2, nombre_rol: "Finanzas" },
    };
    mockUpdate.mockResolvedValue(updated);

    const result = await updateUsuario(5, { id_rol: 2 } as never);

    expect(result).toEqual(updated);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id_usuario: 5 },
        data: { id_rol: 2 },
        select: expect.any(Object),
      })
    );
  });

  it("AU04-U2: traduce el error Prisma P2025 a NotFoundError", async () => {
    mockUpdate.mockRejectedValue({ code: "P2025" });

    await expect(updateUsuario(999, { id_rol: 2 } as never)).rejects.toThrow(NotFoundError);
  });

  it("AU04-U3: re-lanza errores de Prisma distintos a P2025", async () => {
    const dbError = Object.assign(new Error("FK violation"), { code: "P2003" });
    mockUpdate.mockRejectedValue(dbError);

    await expect(updateUsuario(5, { id_rol: 99 } as never)).rejects.toThrow("FK violation");
  });
});
