/**
 * @jest-environment node
 */
import { prisma } from "@/lib/db/client";
import { verifyPassword } from "@/lib/auth/password";
import { generateToken } from "@/lib/auth/tokens";
import { loginUser } from "@/lib/services/auth";
import { UnauthorizedError } from "@/lib/utils/errors";

jest.mock("@/lib/db/client", () => ({
  prisma: {
    usuarios: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock("@/lib/auth/password", () => ({
  verifyPassword: jest.fn(),
}));

jest.mock("@/lib/auth/tokens", () => ({
  generateToken: jest.fn(),
}));

const mockFindUnique = prisma.usuarios.findUnique as jest.Mock;
const mockUpdate = prisma.usuarios.update as jest.Mock;
const mockVerifyPassword = verifyPassword as jest.Mock;
const mockGenerateToken = generateToken as jest.Mock;

const activeUser = {
  id_usuario: 1,
  nombre_completo: "Ada Lovelace",
  correo_electronico: "ada@example.com",
  contrasena_hash: "hashed-pw",
  estatus: "Activo",
  rol: { nombre_rol: "Administrador" },
};

describe("loginUser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("retorna token y datos del usuario con credenciales válidas", async () => {
    mockFindUnique.mockResolvedValue(activeUser);
    mockVerifyPassword.mockResolvedValue(true);
    mockGenerateToken.mockResolvedValue("jwt-token");
    mockUpdate.mockResolvedValue({});

    const result = await loginUser("ada@example.com", "secret");

    expect(result.token).toBe("jwt-token");
    expect(result.user).toEqual({
      id: 1,
      nombre_completo: "Ada Lovelace",
      correo_electronico: "ada@example.com",
      rol: "Administrador",
    });
  });

  it("normaliza el email (trim + lowercase) antes de la búsqueda", async () => {
    mockFindUnique.mockResolvedValue(activeUser);
    mockVerifyPassword.mockResolvedValue(true);
    mockGenerateToken.mockResolvedValue("jwt-token");
    mockUpdate.mockResolvedValue({});

    await loginUser("  Ada@Example.COM  ", "secret");

    expect(mockFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { correo_electronico: "ada@example.com" } })
    );
  });

  it("actualiza ultimo_acceso tras un login exitoso", async () => {
    mockFindUnique.mockResolvedValue(activeUser);
    mockVerifyPassword.mockResolvedValue(true);
    mockGenerateToken.mockResolvedValue("jwt-token");
    mockUpdate.mockResolvedValue({});

    await loginUser("ada@example.com", "secret");

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id_usuario: 1 },
        data: { ultimo_acceso: expect.any(Date) },
      })
    );
  });

  it("genera el token con id, email y rol del usuario", async () => {
    mockFindUnique.mockResolvedValue(activeUser);
    mockVerifyPassword.mockResolvedValue(true);
    mockGenerateToken.mockResolvedValue("jwt-token");
    mockUpdate.mockResolvedValue({});

    await loginUser("ada@example.com", "secret");

    expect(mockGenerateToken).toHaveBeenCalledWith({
      id: 1,
      email: "ada@example.com",
      rol: "Administrador",
    });
  });

  it("lanza UnauthorizedError cuando el usuario no existe", async () => {
    mockFindUnique.mockResolvedValue(null);

    await expect(loginUser("nadie@example.com", "secret")).rejects.toThrow(UnauthorizedError);
    expect(mockVerifyPassword).not.toHaveBeenCalled();
  });

  it("lanza UnauthorizedError cuando el usuario no está Activo", async () => {
    mockFindUnique.mockResolvedValue({ ...activeUser, estatus: "Inactivo" });

    await expect(loginUser("ada@example.com", "secret")).rejects.toThrow(UnauthorizedError);
    expect(mockVerifyPassword).not.toHaveBeenCalled();
  });

  it("lanza UnauthorizedError cuando la contraseña es incorrecta", async () => {
    mockFindUnique.mockResolvedValue(activeUser);
    mockVerifyPassword.mockResolvedValue(false);

    await expect(loginUser("ada@example.com", "wrong")).rejects.toThrow(UnauthorizedError);
    expect(mockGenerateToken).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("no actualiza ultimo_acceso si las credenciales son inválidas", async () => {
    mockFindUnique.mockResolvedValue(null);

    await expect(loginUser("ada@example.com", "secret")).rejects.toThrow(UnauthorizedError);
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
