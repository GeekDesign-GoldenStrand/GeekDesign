/**
 * @jest-environment node
 */

// jose ships ESM that next/jest does not transpile in tests, so we mock it and
// assert tokens.ts's own logic (secret guard, claim shaping, null-on-failure).
const mockSign = jest.fn();
const mockSetExpirationTime = jest.fn().mockReturnThis();
const mockSetIssuedAt = jest.fn().mockReturnThis();
const mockSetProtectedHeader = jest.fn().mockReturnThis();
const mockJwtVerify = jest.fn();

jest.mock("jose", () => ({
  SignJWT: jest.fn().mockImplementation(() => ({
    setProtectedHeader: mockSetProtectedHeader,
    setIssuedAt: mockSetIssuedAt,
    setExpirationTime: mockSetExpirationTime,
    sign: mockSign,
  })),
  jwtVerify: (...args: unknown[]) => mockJwtVerify(...args),
}));

import { SignJWT } from "jose";

import { generateToken, verifyToken } from "@/lib/auth/tokens";

const SECRET = "test-secret-test-secret-test-secret-1234"; // >= 32 chars
const claims = { id: 1, email: "ada@example.com", rol: "Administrador" as const };

describe("tokens (AU-01)", () => {
  const originalSecret = process.env.AUTH_SECRET;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSetProtectedHeader.mockReturnThis();
    mockSetIssuedAt.mockReturnThis();
    mockSetExpirationTime.mockReturnThis();
    process.env.AUTH_SECRET = SECRET;
  });

  afterAll(() => {
    process.env.AUTH_SECRET = originalSecret;
  });

  it("AU01-T1: generateToken firma con los claims y devuelve el JWT", async () => {
    mockSign.mockResolvedValue("signed.jwt.token");

    const token = await generateToken(claims);

    expect(token).toBe("signed.jwt.token");
    expect(SignJWT).toHaveBeenCalledWith({
      id: claims.id,
      email: claims.email,
      rol: claims.rol,
    });
    expect(mockSetProtectedHeader).toHaveBeenCalledWith({ alg: "HS256" });
    expect(mockSetExpirationTime).toHaveBeenCalledWith("8h");
  });

  it("AU01-T1b: verifyToken devuelve los claims cuando el payload es válido", async () => {
    mockJwtVerify.mockResolvedValue({ payload: { ...claims } });

    expect(await verifyToken("good")).toEqual(claims);
  });

  it("AU01-T2: verifyToken devuelve null si jwtVerify lanza (firma/manipulación)", async () => {
    mockJwtVerify.mockRejectedValue(new Error("signature verification failed"));

    expect(await verifyToken("tampered")).toBeNull();
  });

  it("AU01-T3: verifyToken devuelve null si jwtVerify lanza por expiración", async () => {
    mockJwtVerify.mockRejectedValue(new Error('"exp" claim timestamp check failed'));

    expect(await verifyToken("expired")).toBeNull();
  });

  it("AU01-T3b: verifyToken devuelve null cuando faltan/ son inválidos los claims", async () => {
    mockJwtVerify.mockResolvedValue({ payload: { id: "no-numero", email: 1 } });

    expect(await verifyToken("weird")).toBeNull();
  });

  it("AU01-T4: generateToken lanza Error si AUTH_SECRET no está definido", async () => {
    delete process.env.AUTH_SECRET;
    await expect(generateToken(claims)).rejects.toThrow(/AUTH_SECRET/);
  });

  it("AU01-T4b: generateToken lanza Error si AUTH_SECRET tiene menos de 32 caracteres", async () => {
    process.env.AUTH_SECRET = "too-short";
    await expect(generateToken(claims)).rejects.toThrow(/AUTH_SECRET/);
  });

  it("AU01-T4c: verifyToken propaga el guard de AUTH_SECRET como null", async () => {
    delete process.env.AUTH_SECRET;
    // getSecret() throws inside the try/catch -> verifyToken returns null.
    expect(await verifyToken("any")).toBeNull();
  });
});
