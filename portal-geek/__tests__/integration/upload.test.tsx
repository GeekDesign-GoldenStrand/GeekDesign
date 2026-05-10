/**
 * @jest-environment node
 */
import { createApp } from "../helpers/next-supertest";

jest.mock("@/lib/services/storage", () => ({
  presignPut: jest.fn(async (key: string) => `https://signed.example/${key}`),
  DEFAULT_TTL_SECONDS: 300,
}));

const mockGetSession = jest.fn();
jest.mock("@/lib/auth/session", () => ({
  getSession: () => mockGetSession(),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const routes = require("@/app/api/upload/route");

describe("POST /api/upload", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue({ id: 1, role: "Direccion" });
  });

  it("retorna 401 cuando no hay sesión", async () => {
    mockGetSession.mockResolvedValue(null);
    const res = await createApp({ POST: routes.POST }).post("/api/upload").send({
      category: "materiales",
      contentType: "image/jpeg",
      size: 1024,
    });
    expect(res.status).toBe(401);
  });

  it("emite key + url presignada para una imagen válida en materiales", async () => {
    const res = await createApp({ POST: routes.POST }).post("/api/upload").send({
      category: "materiales",
      contentType: "image/jpeg",
      size: 1024,
    });
    expect(res.status).toBe(200);
    expect(res.body.data.key).toMatch(/^materiales\/\d{4}\/\d{2}\/[0-9a-f-]{36}\.jpg$/);
    expect(res.body.data.url).toContain("https://signed.example/");
    expect(res.body.data.expiresIn).toBe(300);
  });

  it("normaliza Content-Type con parámetros (image/svg+xml; charset=utf-8)", async () => {
    const res = await createApp({ POST: routes.POST }).post("/api/upload").send({
      category: "disenios",
      contentType: "image/svg+xml; charset=utf-8",
      filename: "logo.svg",
      size: 1024,
    });
    expect(res.status).toBe(200);
    expect(res.body.data.key).toMatch(/^disenios\/\d{4}\/\d{2}\/.+\.svg$/);
  });

  it("retorna 403 para la categoría 'cotizaciones' (server-only)", async () => {
    const res = await createApp({ POST: routes.POST }).post("/api/upload").send({
      category: "cotizaciones",
      contentType: "application/pdf",
      size: 1024,
    });
    expect(res.status).toBe(403);
  });

  it("retorna 422 cuando el mime no está permitido para la categoría", async () => {
    const res = await createApp({ POST: routes.POST }).post("/api/upload").send({
      category: "materiales",
      contentType: "application/pdf",
      size: 1024,
    });
    expect(res.status).toBe(422);
  });

  it("retorna 422 cuando el archivo excede el tamaño máximo", async () => {
    const res = await createApp({ POST: routes.POST })
      .post("/api/upload")
      .send({
        category: "materiales",
        contentType: "image/jpeg",
        size: 50 * 1024 * 1024,
      });
    expect(res.status).toBe(422);
  });

  it("retorna 422 cuando 'disenios' no incluye filename", async () => {
    const res = await createApp({ POST: routes.POST }).post("/api/upload").send({
      category: "disenios",
      contentType: "application/pdf",
      size: 1024,
    });
    expect(res.status).toBe(422);
  });

  it("retorna 422 cuando la extensión de 'disenios' no está permitida", async () => {
    const res = await createApp({ POST: routes.POST }).post("/api/upload").send({
      category: "disenios",
      contentType: "application/pdf",
      filename: "evil.exe",
      size: 1024,
    });
    expect(res.status).toBe(422);
  });

  it("retorna 422 cuando la categoría es desconocida", async () => {
    const res = await createApp({ POST: routes.POST }).post("/api/upload").send({
      category: "no-existe",
      contentType: "image/jpeg",
      size: 1024,
    });
    expect(res.status).toBe(422);
  });
});
