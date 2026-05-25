/**
 * @jest-environment node
 */
import crypto from "node:crypto";

import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db/client";
import { sendMail } from "@/lib/email/mailer";
import { requestPasswordReset, resetPassword } from "@/lib/services/password-reset";
import { NotFoundError } from "@/lib/utils/errors";

jest.mock("@/lib/db/client", () => ({
  prisma: {
    usuarios: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    tokensRecuperacion: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock("@/lib/email/mailer", () => ({
  sendMail: jest.fn(),
}));

jest.mock("@/lib/auth/password", () => ({
  hashPassword: jest.fn(),
}));

const mockUserFindUnique = prisma.usuarios.findUnique as jest.Mock;
const mockTokenUpsert = prisma.tokensRecuperacion.upsert as jest.Mock;
const mockTokenFindUnique = prisma.tokensRecuperacion.findUnique as jest.Mock;
const mockTransaction = prisma.$transaction as unknown as jest.Mock;
const mockSendMail = sendMail as jest.Mock;
const mockHashPassword = hashPassword as jest.Mock;

const sha256 = (s: string) => crypto.createHash("sha256").update(s).digest("hex");

const activeUser = {
  id_usuario: 7,
  nombre_completo: "Ada Lovelace",
  correo_electronico: "ada@example.com",
  estatus: "Activo",
};

describe("requestPasswordReset (AU-02)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("AU02-U1: con usuario activo hace upsert del token y envía correo", async () => {
    mockUserFindUnique.mockResolvedValue(activeUser);
    mockTokenUpsert.mockResolvedValue({});
    mockSendMail.mockResolvedValue(undefined);

    await requestPasswordReset("ada@example.com");

    expect(mockTokenUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id_usuario: 7 },
        create: expect.objectContaining({
          id_usuario: 7,
          token_hash: expect.any(String),
          expira_en: expect.any(Date),
        }),
      })
    );
    expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({ to: "ada@example.com" }));
  });

  it("AU02-U2: con correo inexistente no envía correo ni hace upsert (silencioso)", async () => {
    mockUserFindUnique.mockResolvedValue(null);

    await expect(requestPasswordReset("nadie@example.com")).resolves.toBeUndefined();
    expect(mockTokenUpsert).not.toHaveBeenCalled();
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it("AU02-U3: con usuario inactivo no hace nada (silencioso)", async () => {
    mockUserFindUnique.mockResolvedValue({ ...activeUser, estatus: "Inactivo" });

    await expect(requestPasswordReset("ada@example.com")).resolves.toBeUndefined();
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it("AU02-U4: normaliza el email (trim + lowercase) antes del lookup", async () => {
    mockUserFindUnique.mockResolvedValue(null);

    await requestPasswordReset("  Ada@Example.COM  ");

    expect(mockUserFindUnique).toHaveBeenCalledWith({
      where: { correo_electronico: "ada@example.com" },
    });
  });

  it("AU02-U5: el token persistido es el hash sha256, no el valor enviado", async () => {
    mockUserFindUnique.mockResolvedValue(activeUser);
    mockTokenUpsert.mockResolvedValue({});
    mockSendMail.mockResolvedValue(undefined);

    await requestPasswordReset("ada@example.com");

    const upsertArg = mockTokenUpsert.mock.calls[0][0];
    const storedHash = upsertArg.create.token_hash;
    const mailArg = mockSendMail.mock.calls[0][0];
    const rawToken = mailArg.html.match(/token=([a-f0-9]+)/)![1];

    expect(rawToken).not.toBe(storedHash);
    expect(sha256(rawToken)).toBe(storedHash);
  });

  it("AU02-U6: si sendMail falla, se captura y no propaga (anti-enumeración)", async () => {
    mockUserFindUnique.mockResolvedValue(activeUser);
    mockTokenUpsert.mockResolvedValue({});
    mockSendMail.mockRejectedValue(new Error("SMTP down"));
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    await expect(requestPasswordReset("ada@example.com")).resolves.toBeUndefined();
    expect(errSpy).toHaveBeenCalled();

    errSpy.mockRestore();
  });

  it("AU02-U12: escapa HTML del nombre en el correo (anti-XSS)", async () => {
    mockUserFindUnique.mockResolvedValue({
      ...activeUser,
      nombre_completo: "<script>alert(1)</script>",
    });
    mockTokenUpsert.mockResolvedValue({});
    mockSendMail.mockResolvedValue(undefined);

    await requestPasswordReset("ada@example.com");

    const html = mockSendMail.mock.calls[0][0].html as string;
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });
});

describe("resetPassword (AU-02)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHashPassword.mockResolvedValue("new-hash");
    mockTransaction.mockResolvedValue([]);
  });

  it("AU02-U8: con token válido y vigente hashea y persiste en transacción", async () => {
    mockTokenFindUnique.mockResolvedValue({
      id: 1,
      id_usuario: 7,
      usado: false,
      expira_en: new Date(Date.now() + 60_000),
    });

    await resetPassword("raw-token", "NuevaPass123");

    expect(mockHashPassword).toHaveBeenCalledWith("NuevaPass123");
    expect(mockTransaction).toHaveBeenCalledWith(expect.any(Array));
    expect(mockTokenFindUnique).toHaveBeenCalledWith({
      where: { token_hash: sha256("raw-token") },
    });
  });

  it("AU02-U9: con token inexistente lanza NotFoundError", async () => {
    mockTokenFindUnique.mockResolvedValue(null);
    await expect(resetPassword("x", "NuevaPass123")).rejects.toThrow(NotFoundError);
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("AU02-U10: con token ya usado lanza NotFoundError", async () => {
    mockTokenFindUnique.mockResolvedValue({
      id: 1,
      id_usuario: 7,
      usado: true,
      expira_en: new Date(Date.now() + 60_000),
    });
    await expect(resetPassword("x", "NuevaPass123")).rejects.toThrow(NotFoundError);
  });

  it("AU02-U11: con token expirado lanza NotFoundError", async () => {
    mockTokenFindUnique.mockResolvedValue({
      id: 1,
      id_usuario: 7,
      usado: false,
      expira_en: new Date(Date.now() - 60_000),
    });
    await expect(resetPassword("x", "NuevaPass123")).rejects.toThrow(NotFoundError);
  });
});
