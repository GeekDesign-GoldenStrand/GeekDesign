/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

jest.mock("@/lib/services/storage", () => ({
  presignGet: jest.fn(async (key: string) => `https://signed.example/${key}`),
  publicUrl: jest.fn(() => null),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const route = require("@/app/api/images/[...key]/route");

const MAT_KEY = "materiales/2026/05/11111111-2222-3333-4444-555555555555.jpg";
const DIS_KEY = "disenios/2026/05/11111111-2222-3333-4444-555555555555.pdf";

function call(keyPath: string) {
  return route.GET(new NextRequest(`http://localhost/api/images/${keyPath}`), {
    params: Promise.resolve({ key: keyPath.split("/") }),
  });
}

describe("GET /api/images/[...key]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("302 redirige a la URL presignada para una clave pública (materiales)", async () => {
    const res = await call(MAT_KEY);
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe(`https://signed.example/${MAT_KEY}`);
    expect(res.headers.get("cache-control")).toContain("max-age=");
  });

  it("404 cuando la categoría no es pública (disenios)", async () => {
    const res = await call(DIS_KEY);
    expect(res.status).toBe(404);
  });

  it("422 cuando la clave tiene un formato inválido", async () => {
    const res = await call("materiales/not-a-uuid.jpg");
    expect(res.status).toBe(422);
  });
});
