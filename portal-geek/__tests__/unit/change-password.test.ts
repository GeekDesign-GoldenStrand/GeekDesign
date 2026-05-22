/**
 * @jest-environment node
 */
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db/client";
import { changePassword } from "@/lib/services/change-password";
import { NotFoundError, UnauthorizedError } from "@/lib/utils/errors";

jest.mock("@/lib/db/client", () => ({
  prisma: {
    usuarios: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock("@/lib/auth/password", () => ({
  hashPassword: jest.fn(),
  verifyPassword: jest.fn(),
}));

const mockFindUnique = prisma.usuarios.findUnique as jest.Mock;
const mockUpdate = prisma.usuarios.update as jest.Mock;
const mockHashPassword = hashPassword as jest.Mock;
const mockVerifyPassword = verifyPassword as jest.Mock;

describe("changePassword (AU-03)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("AU03-U1: lanza NotFoundError cuando el usuario no existe", async () => {
    mockFindUnique.mockResolvedValue(null);

    await expect(changePassword(1, "actual", "NuevaPass123")).rejects.toThrow(NotFoundError);
    expect(mockVerifyPassword).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("AU03-U2: lanza UnauthorizedError si la contraseña actual es incorrecta", async () => {
    mockFindUnique.mockResolvedValue({ contrasena_hash: "old-hash" });
    mockVerifyPassword.mockResolvedValue(false);

    await expect(changePassword(1, "mala", "NuevaPass123")).rejects.toThrow(UnauthorizedError);
    expect(mockHashPassword).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("AU03-U3: con contraseña actual correcta hashea y persiste la nueva", async () => {
    mockFindUnique.mockResolvedValue({ contrasena_hash: "old-hash" });
    mockVerifyPassword.mockResolvedValue(true);
    mockHashPassword.mockResolvedValue("new-hash");
    mockUpdate.mockResolvedValue({});

    await expect(changePassword(1, "actual", "NuevaPass123")).resolves.toBeUndefined();

    expect(mockHashPassword).toHaveBeenCalledWith("NuevaPass123");
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id_usuario: 1 },
      data: { contrasena_hash: "new-hash" },
    });
  });

  it("AU03-U4: verifica la contraseña actual antes de hashear la nueva", async () => {
    const order: string[] = [];
    mockFindUnique.mockResolvedValue({ contrasena_hash: "old-hash" });
    mockVerifyPassword.mockImplementation(async () => {
      order.push("verify");
      return true;
    });
    mockHashPassword.mockImplementation(async () => {
      order.push("hash");
      return "new-hash";
    });
    mockUpdate.mockResolvedValue({});

    await changePassword(1, "actual", "NuevaPass123");

    expect(order).toEqual(["verify", "hash"]);
  });
});
