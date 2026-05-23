/**
 * @jest-environment node
 */
import type { NextRequest } from "next/server";

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock("@/lib/storage/keys", () => ({
  ...jest.requireActual("@/lib/storage/keys"),
  buildKey: jest.fn().mockReturnValue("disenios/2026/05/mock-uuid.png"),
}));

jest.mock("@/lib/services/storage", () => ({
  presignPut: jest.fn().mockResolvedValue("https://storage.example.com/signed-put-url"),
}));

// Reset rate-limit state between tests by re-importing the module fresh
jest.mock("@/lib/utils/rate-limit", () => ({
  checkRateLimit: jest.fn().mockReturnValue({ allowed: true }),
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

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/upload/disenios", () => {
  let POST: (req: NextRequest) => Promise<Response>;

  beforeAll(async () => {
    const mod = await import("@/app/api/upload/disenios/route");
    POST = mod.POST;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    const { checkRateLimit } = jest.requireMock("@/lib/utils/rate-limit");
    checkRateLimit.mockReturnValue({ allowed: true });
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
    const { checkRateLimit } = jest.requireMock("@/lib/utils/rate-limit");
    checkRateLimit.mockReturnValue({ allowed: false });

    const res = await POST(
      makeRequest({ contentType: "image/png", size: 1024, filename: "logo.png" })
    );
    expect(res.status).toBe(429);
  });
});
