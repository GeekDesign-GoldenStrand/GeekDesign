/**
 * @jest-environment node
 */
import type { NextRequest } from "next/server";

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock("@/lib/storage/keys", () => ({
  ...jest.requireActual("@/lib/storage/keys"),
  buildKey: jest.fn().mockReturnValue("disenios/2026/05/mock-uuid.png"),
}));

const mockDeleteObject = jest.fn(async (_key: string) => {});
jest.mock("@/lib/services/storage", () => ({
  presignPut: jest.fn().mockResolvedValue("https://storage.example.com/signed-put-url"),
  deleteObject: (key: string) => mockDeleteObject(key),
  DEFAULT_TTL_SECONDS: 300,
}));

// peekRateLimit gates the request; recordAttempt only fires on success.
jest.mock("@/lib/utils/rate-limit", () => ({
  peekRateLimit: jest.fn().mockReturnValue({ allowed: true, remaining: 20, retryAfterMs: 0 }),
  recordAttempt: jest.fn(),
}));

const mockFindFirst = jest.fn();
jest.mock("@/lib/db/client", () => ({
  prisma: { archivosDisenio: { findFirst: (...a: unknown[]) => mockFindFirst(...a) } },
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

// PresignUploadSchema requires `category`; the route ignores the value and
// forces "disenios", but parsing would fail without it.
function makeRequest(body: Record<string, unknown>, ip = "127.0.0.1"): NextRequest {
  return {
    json: () => Promise.resolve({ category: "disenios", ...body }),
    headers: { get: (h: string) => (h === "x-forwarded-for" ? ip : null) },
  } as unknown as NextRequest;
}

function makeDeleteRequest(key: string, ip = "127.0.0.1"): NextRequest {
  return {
    url: `http://localhost/api/upload/disenios?key=${encodeURIComponent(key)}`,
    headers: { get: (h: string) => (h === "x-forwarded-for" ? ip : null) },
  } as unknown as NextRequest;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/upload/disenios", () => {
  let POST: (req: NextRequest) => Promise<Response>;

  beforeAll(async () => {
    const mod = await import("@/app/api/upload/disenios/route");
    POST = mod.POST;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockFindFirst.mockResolvedValue(null);
    const { peekRateLimit } = jest.requireMock("@/lib/utils/rate-limit");
    peekRateLimit.mockReturnValue({ allowed: true, remaining: 20, retryAfterMs: 0 });
  });

  it("devuelve 200 con key y uploadUrl para un PNG válido", async () => {
    const res = await POST(
      makeRequest({ contentType: "image/png", size: 1024 * 100, filename: "logo.png" })
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.key).toBe("disenios/2026/05/mock-uuid.png");
    expect(json.data.url).toContain("signed-put-url");
  });

  it("devuelve 200 para un archivo AI (application/postscript)", async () => {
    const res = await POST(
      makeRequest({ contentType: "application/postscript", size: 512 * 1024, filename: "logo.ai" })
    );
    expect(res.status).toBe(200);
  });

  it("devuelve 200 para un DXF (application/octet-stream + .dxf)", async () => {
    const res = await POST(
      makeRequest({
        contentType: "application/octet-stream",
        size: 256 * 1024,
        filename: "plano.dxf",
      })
    );
    expect(res.status).toBe(200);
  });

  it("devuelve 422 para una extensión no permitida (.exe)", async () => {
    const res = await POST(
      makeRequest({
        contentType: "application/octet-stream",
        size: 1024,
        filename: "virus.exe",
      })
    );
    expect(res.status).toBe(422);
  });

  it("devuelve 422 si el archivo supera 10 MB", async () => {
    const res = await POST(
      makeRequest({
        contentType: "image/png",
        size: 11 * 1024 * 1024,
        filename: "huge.png",
      })
    );
    expect(res.status).toBe(422);
  });

  it("devuelve 422 si falta el contentType", async () => {
    const res = await POST(makeRequest({ size: 1024, filename: "logo.png" }));
    expect(res.status).toBe(422);
  });

  it("devuelve 429 cuando se supera el rate limit", async () => {
    const { peekRateLimit } = jest.requireMock("@/lib/utils/rate-limit");
    peekRateLimit.mockReturnValue({ allowed: false, remaining: 0, retryAfterMs: 30_000 });

    const res = await POST(
      makeRequest({ contentType: "image/png", size: 1024, filename: "logo.png" })
    );
    expect(res.status).toBe(429);
  });
});

describe("DELETE /api/upload/disenios", () => {
  const ORPHAN_KEY = "disenios/2026/05/11111111-2222-3333-4444-555555555555.dxf";

  let DELETE: (req: NextRequest) => Promise<Response>;

  beforeAll(async () => {
    const mod = await import("@/app/api/upload/disenios/route");
    DELETE = mod.DELETE;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockFindFirst.mockResolvedValue(null);
    const { peekRateLimit } = jest.requireMock("@/lib/utils/rate-limit");
    peekRateLimit.mockReturnValue({ allowed: true, remaining: 20, retryAfterMs: 0 });
  });

  it("elimina una clave huérfana sin requerir sesión", async () => {
    const res = await DELETE(makeDeleteRequest(ORPHAN_KEY));
    expect(res.status).toBe(200);
    expect(mockDeleteObject).toHaveBeenCalledWith(ORPHAN_KEY);
  });

  it("retorna 422 cuando la clave no tiene formato válido", async () => {
    const res = await DELETE(makeDeleteRequest("not-a-valid-key"));
    expect(res.status).toBe(422);
    expect(mockDeleteObject).not.toHaveBeenCalled();
  });

  it("retorna 422 cuando la clave es de otra categoría (materiales)", async () => {
    const res = await DELETE(
      makeDeleteRequest("materiales/2026/05/11111111-2222-3333-4444-555555555555.jpg")
    );
    expect(res.status).toBe(422);
    expect(mockDeleteObject).not.toHaveBeenCalled();
  });

  it("retorna 409 cuando la clave ya está persistida en ArchivosDisenio", async () => {
    mockFindFirst.mockResolvedValue({ id_archivo: 3 });
    const res = await DELETE(makeDeleteRequest(ORPHAN_KEY));
    expect(res.status).toBe(409);
    expect(mockDeleteObject).not.toHaveBeenCalled();
  });

  it("retorna 429 cuando se supera el rate limit", async () => {
    const { peekRateLimit } = jest.requireMock("@/lib/utils/rate-limit");
    peekRateLimit.mockReturnValue({ allowed: false, remaining: 0, retryAfterMs: 30_000 });
    const res = await DELETE(makeDeleteRequest(ORPHAN_KEY));
    expect(res.status).toBe(429);
    expect(mockDeleteObject).not.toHaveBeenCalled();
  });
});
