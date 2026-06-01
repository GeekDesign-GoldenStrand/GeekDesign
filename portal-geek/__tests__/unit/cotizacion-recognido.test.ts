/**
 * @jest-environment node
 */

// Recognized-client cookie JWT (checkout prefill). jose ships ESM that
// next/jest does not transpile in tests, so we mock it (same pattern as
// tokens.test.ts) and assert this module's own logic: the claims it signs,
// the purpose-claim guard, and null-on-failure for tampered/expired tokens.
const mockSign = jest.fn();
const mockSetExpirationTime = jest.fn().mockReturnThis();
const mockSetIssuedAt = jest.fn().mockReturnThis();
const mockSetProtectedHeader = jest.fn().mockReturnThis();
const mockJwtVerify = jest.fn();
let lastSignPayload: Record<string, unknown> | undefined;

jest.mock("jose", () => ({
  SignJWT: jest.fn().mockImplementation((payload: Record<string, unknown>) => {
    lastSignPayload = payload;
    return {
      setProtectedHeader: mockSetProtectedHeader,
      setIssuedAt: mockSetIssuedAt,
      setExpirationTime: mockSetExpirationTime,
      sign: mockSign,
    };
  }),
  jwtVerify: (...args: unknown[]) => mockJwtVerify(...args),
}));

import { signClienteJWT, readClienteId } from "@/lib/services/cotizacion-access";

const SECRET = "test-secret-test-secret-test-secret-1234"; // >= 32 chars

describe("recognized-client JWT (checkout prefill)", () => {
  const originalSecret = process.env.AUTH_SECRET;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSetProtectedHeader.mockReturnThis();
    mockSetIssuedAt.mockReturnThis();
    mockSetExpirationTime.mockReturnThis();
    lastSignPayload = undefined;
    process.env.AUTH_SECRET = SECRET;
  });

  afterAll(() => {
    process.env.AUTH_SECRET = originalSecret;
  });

  describe("signClienteJWT", () => {
    it("signs id_cliente together with an explicit purpose claim", async () => {
      mockSign.mockResolvedValue("signed.cliente.jwt");

      const token = await signClienteJWT(42);

      expect(token).toBe("signed.cliente.jwt");
      expect(lastSignPayload).toEqual({ id_cliente: 42, purpose: "cliente_recognido" });
      expect(mockSetProtectedHeader).toHaveBeenCalledWith({ alg: "HS256" });
      // 90-day TTL.
      expect(mockSetExpirationTime).toHaveBeenCalledWith(`${90 * 24 * 60 * 60}s`);
    });
  });

  describe("readClienteId", () => {
    it("returns id_cliente for a valid token with the right purpose", async () => {
      mockJwtVerify.mockResolvedValue({
        payload: { id_cliente: 42, purpose: "cliente_recognido" },
      });
      expect(await readClienteId("good")).toBe(42);
    });

    it("returns null when jwtVerify throws (tampered signature)", async () => {
      mockJwtVerify.mockRejectedValue(new Error("signature verification failed"));
      expect(await readClienteId("tampered")).toBeNull();
    });

    it("returns null when jwtVerify throws on expiry", async () => {
      mockJwtVerify.mockRejectedValue(new Error('"exp" claim timestamp check failed'));
      expect(await readClienteId("expired")).toBeNull();
    });

    // Token-confusion guard: a token validly signed with the SAME secret but
    // for another purpose (e.g. a session token, or a future payload) must be
    // rejected even though it verifies.
    it("returns null when the purpose claim is missing", async () => {
      mockJwtVerify.mockResolvedValue({ payload: { id_cliente: 42 } });
      expect(await readClienteId("no-purpose")).toBeNull();
    });

    it("returns null when the purpose claim is wrong", async () => {
      mockJwtVerify.mockResolvedValue({
        payload: { id_cliente: 42, purpose: "cotizacion_session" },
      });
      expect(await readClienteId("wrong-purpose")).toBeNull();
    });

    it("returns null when id_cliente is not a number", async () => {
      mockJwtVerify.mockResolvedValue({
        payload: { id_cliente: "42", purpose: "cliente_recognido" },
      });
      expect(await readClienteId("string-id")).toBeNull();
    });

    it("propagates the AUTH_SECRET guard as null", async () => {
      delete process.env.AUTH_SECRET;
      expect(await readClienteId("any")).toBeNull();
    });
  });
});
