/**
 * @jest-environment node
 */
import crypto from "node:crypto";

import { prisma } from "@/lib/db/client";
import { CLIENTE_COOKIE_NAME } from "@/lib/services/cotizacion-access";

import { createApp } from "../helpers/next-supertest";

// jose ships ESM that next/jest does not transpile, so mock it (same pattern as
// tokens.test.ts). We capture each signed payload to assert what the access
// route puts into the recognized-client cookie.
const signPayloads: Record<string, unknown>[] = [];
const mockSign = jest.fn().mockResolvedValue("signed.jwt.token");

jest.mock("jose", () => ({
  SignJWT: jest.fn().mockImplementation((payload: Record<string, unknown>) => {
    signPayloads.push(payload);
    return {
      setProtectedHeader: jest.fn().mockReturnThis(),
      setIssuedAt: jest.fn().mockReturnThis(),
      setExpirationTime: jest.fn().mockReturnThis(),
      sign: mockSign,
    };
  }),
  jwtVerify: jest.fn(),
}));

jest.mock("@/lib/db/client", () => ({
  prisma: {
    tokensAccesoCotizacion: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    cotizaciones: {
      findUnique: jest.fn(),
    },
  },
}));

const mockTokenFindUnique = prisma.tokensAccesoCotizacion.findUnique as jest.Mock;
const mockTokenUpdate = prisma.tokensAccesoCotizacion.update as jest.Mock;
const mockCotFindUnique = prisma.cotizaciones.findUnique as jest.Mock;

const SECRET = "test-secret-test-secret-test-secret-1234"; // >= 32 chars

// Find a named cookie's raw Set-Cookie directive in the response.
function rawCookieFor(setCookie: string | string[] | undefined, name: string): string | undefined {
  const headers = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [];
  return headers.find((h) => h.startsWith(`${name}=`));
}

function cookieValue(setCookie: string | string[] | undefined, name: string): string | null {
  const raw = rawCookieFor(setCookie, name);
  if (!raw) return null;
  return raw.slice(name.length + 1).split(";")[0];
}

describe("storefront recognized-client cookie", () => {
  const originalSecret = process.env.AUTH_SECRET;

  beforeAll(() => {
    process.env.AUTH_SECRET = SECRET;
  });

  afterAll(() => {
    process.env.AUTH_SECRET = originalSecret;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    signPayloads.length = 0;
    mockSign.mockResolvedValue("signed.jwt.token");
  });

  describe("DELETE /api/storefront/cliente-recognido", () => {
    it("clears the cliente_recognido cookie (Max-Age=0) and returns ok", async () => {
      const routes = await import("@/app/api/storefront/cliente-recognido/route");
      const res = await createApp({ DELETE: routes.DELETE }).delete(
        "/api/storefront/cliente-recognido"
      );

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ok: true });

      const raw = rawCookieFor(res.headers["set-cookie"], CLIENTE_COOKIE_NAME);
      expect(raw).toBeDefined();
      expect(raw).toMatch(/Max-Age=0/i);
      expect(raw).toMatch(/HttpOnly/i);
      expect(cookieValue(res.headers["set-cookie"], CLIENTE_COOKIE_NAME)).toBe("");
    });
  });

  describe("GET /api/storefront/cotizaciones/access", () => {
    // Build a valid magic-link token row the way issueAccessToken would.
    function validTokenRow(id_cotizacion: number) {
      const raw = crypto.randomBytes(32).toString("hex");
      const token_hash = crypto.createHash("sha256").update(raw).digest("hex");
      return {
        raw,
        record: {
          id: 1,
          id_cotizacion,
          token_hash,
          usado: false,
          expira_en: new Date(Date.now() + 30 * 60 * 1000),
        },
      };
    }

    it("sets the recognized cookie bound to the owning id_cliente after a valid visit", async () => {
      const { raw, record } = validTokenRow(55);
      mockTokenFindUnique.mockResolvedValue(record);
      mockTokenUpdate.mockResolvedValue({ ...record, usado: true });
      mockCotFindUnique.mockResolvedValue({ folio: "COT-001", id_cliente: 99 });

      const routes = await import("@/app/api/storefront/cotizaciones/access/route");
      const res = await createApp({ GET: routes.GET }).get(
        `/api/storefront/cotizaciones/access?token=${raw}`
      );

      // Redirects to the tracker on success.
      expect(res.status).toBe(307);
      expect(res.headers.location).toContain("/tienda/cotizacion/COT-001");

      // The recognized cookie is set with the signed JWT...
      const cookie = cookieValue(res.headers["set-cookie"], CLIENTE_COOKIE_NAME);
      expect(cookie).toBe("signed.jwt.token");
      // ...and it was signed for THIS client, carrying the purpose-claim guard.
      expect(signPayloads).toContainEqual({ id_cliente: 99, purpose: "cliente_recognido" });
    });

    it("does not set the recognized cookie when the cotización has no id_cliente", async () => {
      const { raw, record } = validTokenRow(56);
      mockTokenFindUnique.mockResolvedValue(record);
      mockTokenUpdate.mockResolvedValue({ ...record, usado: true });
      mockCotFindUnique.mockResolvedValue({ folio: "COT-002", id_cliente: null });

      const routes = await import("@/app/api/storefront/cotizaciones/access/route");
      const res = await createApp({ GET: routes.GET }).get(
        `/api/storefront/cotizaciones/access?token=${raw}`
      );

      if (res.status !== 307) {
        console.error("Test failed with 400. Body:", res.text, res.body);
      }
      expect(res.status).toBe(307);
      expect(cookieValue(res.headers["set-cookie"], CLIENTE_COOKIE_NAME)).toBeNull();
      // No recognized-client JWT was signed.
      expect(signPayloads.some((p) => "id_cliente" in p)).toBe(false);
    });

    it("does not set the recognized cookie for an invalid/expired token", async () => {
      mockTokenFindUnique.mockResolvedValue(null); // token not found

      const routes = await import("@/app/api/storefront/cotizaciones/access/route");
      const res = await createApp({ GET: routes.GET }).get(
        "/api/storefront/cotizaciones/access?token=bogus"
      );

      // Redirects to the lookup fallback, no cookie set.
      expect(res.status).toBe(307);
      expect(res.headers.location).toContain("/tienda/cotizacion");
      expect(cookieValue(res.headers["set-cookie"], CLIENTE_COOKIE_NAME)).toBeNull();
      expect(signPayloads.some((p) => "id_cliente" in p)).toBe(false);
    });
  });
});
