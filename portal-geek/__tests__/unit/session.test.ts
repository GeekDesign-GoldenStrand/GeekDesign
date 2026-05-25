/**
 * @jest-environment node
 */

// next/headers and tokens are mocked: session.ts's job is to read the cookie,
// delegate to verifyToken, and shape the SessionPayload. We assert that wiring,
// not jose (ESM, untranspiled in jest) or the Next runtime.
const mockGet = jest.fn();
jest.mock("next/headers", () => ({
  cookies: () => Promise.resolve({ get: mockGet }),
}));

const mockVerifyToken = jest.fn();
jest.mock("@/lib/auth/tokens", () => ({
  verifyToken: (...args: unknown[]) => mockVerifyToken(...args),
}));

import { getSession, SESSION_COOKIE } from "@/lib/auth/session";

const claims = { id: 7, email: "ada@example.com", rol: "Direccion" as const };

describe("getSession (AU-01 sesión)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("AU01-S1: devuelve null cuando no hay cookie de sesión", async () => {
    mockGet.mockReturnValue(undefined);

    expect(await getSession()).toBeNull();
    expect(mockVerifyToken).not.toHaveBeenCalled();
  });

  it("AU01-S2: lee la cookie por su nombre y pasa el token a verifyToken", async () => {
    mockGet.mockReturnValue({ value: "the.jwt.token" });
    mockVerifyToken.mockResolvedValue(claims);

    await getSession();

    expect(mockGet).toHaveBeenCalledWith(SESSION_COOKIE);
    expect(mockVerifyToken).toHaveBeenCalledWith("the.jwt.token");
  });

  it("AU01-S3: devuelve null cuando el token es inválido/expirado (verifyToken null)", async () => {
    mockGet.mockReturnValue({ value: "tampered" });
    mockVerifyToken.mockResolvedValue(null);

    expect(await getSession()).toBeNull();
  });

  it("AU01-S4: con token válido devuelve el payload de sesión (rol -> role)", async () => {
    mockGet.mockReturnValue({ value: "good" });
    mockVerifyToken.mockResolvedValue(claims);

    expect(await getSession()).toEqual({
      id: claims.id,
      email: claims.email,
      role: claims.rol,
    });
  });
});
