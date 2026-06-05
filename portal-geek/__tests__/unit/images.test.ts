import { presignGet, publicUrl } from "@/lib/services/storage";
import { getServiceImageUrls, getServiceImageUrlsResolved } from "@/lib/utils/images";

// jest.mock() is auto-hoisted above the imports above, so the named bindings
// resolve to the mocked module at runtime.
jest.mock("@/lib/services/storage", () => ({
  publicUrl: jest.fn(),
  presignGet: jest.fn(),
}));

const mockPublicUrl = publicUrl as jest.MockedFunction<typeof publicUrl>;
const mockPresignGet = presignGet as jest.MockedFunction<typeof presignGet>;

describe("getServiceImageUrls (sync, proxy path — used by client components)", () => {
  it("retorna un arreglo vacío si el valor es nulo, indefinido o vacío", () => {
    expect(getServiceImageUrls(null)).toEqual([]);
    expect(getServiceImageUrls(undefined)).toEqual([]);
    expect(getServiceImageUrls("")).toEqual([]);
    expect(getServiceImageUrls("   ")).toEqual([]);
  });

  it("retorna la URL tal cual si es una URL externa (http/https)", () => {
    expect(getServiceImageUrls("https://example.com/images/corte.jpg")).toEqual([
      "https://example.com/images/corte.jpg",
    ]);
    expect(getServiceImageUrls("http://example.com/images/grabado.png")).toEqual([
      "http://example.com/images/grabado.png",
    ]);
  });

  it("retorna la ruta tal cual si es una ruta local pública (empieza con /)", () => {
    expect(getServiceImageUrls("/images/services/bordado.png")).toEqual([
      "/images/services/bordado.png",
    ]);
  });

  it("resuelve llaves de S3 normales a través de la API proxy", () => {
    expect(
      getServiceImageUrls("servicios/2026/05/550e8400-e29b-41d4-a716-446655440000.jpg")
    ).toEqual(["/api/images/servicios/2026/05/550e8400-e29b-41d4-a716-446655440000.jpg"]);
  });

  it("parsea correctamente un arreglo serializado como JSON con múltiples llaves/URLs", () => {
    const json = JSON.stringify([
      "servicios/2026/05/550e8400-e29b-41d4-a716-446655440001.png",
      "/images/legacy.jpg",
      "https://example.com/external.png",
    ]);
    expect(getServiceImageUrls(json)).toEqual([
      "/api/images/servicios/2026/05/550e8400-e29b-41d4-a716-446655440001.png",
      "/images/legacy.jpg",
      "https://example.com/external.png",
    ]);
  });

  it("maneja JSON corrupto o inválido envolviendo la cadena en un arreglo de un solo elemento", () => {
    expect(getServiceImageUrls("[invalid-json")).toEqual(["/api/images/[invalid-json"]);
  });

  it("maneja un string que empieza con corchetes pero no es un arreglo JSON", () => {
    expect(getServiceImageUrls("[not-array]")).toEqual(["/api/images/[not-array]"]);
  });
});

describe("getServiceImageUrlsResolved (async, storefront LCP path)", () => {
  beforeEach(() => {
    mockPublicUrl.mockReset();
    mockPresignGet.mockReset();
  });

  it("retorna un arreglo vacío si el valor es nulo, indefinido o vacío", async () => {
    expect(await getServiceImageUrlsResolved(null)).toEqual([]);
    expect(await getServiceImageUrlsResolved(undefined)).toEqual([]);
    expect(await getServiceImageUrlsResolved("")).toEqual([]);
    expect(mockPresignGet).not.toHaveBeenCalled();
    expect(mockPublicUrl).not.toHaveBeenCalled();
  });

  it("prefiere publicUrl cuando está configurado (sin presignar)", async () => {
    mockPublicUrl.mockImplementation((key) => `https://storage.googleapis.com/bucket/${key}`);

    const result = await getServiceImageUrlsResolved(
      JSON.stringify(["servicios/a.jpg", "materiales/b.png"])
    );

    expect(result).toEqual([
      "https://storage.googleapis.com/bucket/servicios/a.jpg",
      "https://storage.googleapis.com/bucket/materiales/b.png",
    ]);
    expect(mockPresignGet).not.toHaveBeenCalled();
  });

  it("cae a presignGet con TTL de 15 min cuando publicUrl retorna null", async () => {
    mockPublicUrl.mockReturnValue(null);
    mockPresignGet.mockImplementation(
      async (key) => `https://storage.googleapis.com/bucket/${key}?sig=test`
    );

    const result = await getServiceImageUrlsResolved("servicios/a.jpg");

    expect(result).toEqual(["https://storage.googleapis.com/bucket/servicios/a.jpg?sig=test"]);
    expect(mockPresignGet).toHaveBeenCalledWith("servicios/a.jpg", 15 * 60);
  });

  it("no llama a publicUrl/presignGet para URLs absolutas o rutas locales", async () => {
    mockPublicUrl.mockReturnValue("should-not-be-used");
    mockPresignGet.mockResolvedValue("should-not-be-used");

    const result = await getServiceImageUrlsResolved(
      JSON.stringify(["https://example.com/x.png", "/images/legacy.jpg", "servicios/k.jpg"])
    );

    expect(result).toEqual([
      "https://example.com/x.png",
      "/images/legacy.jpg",
      "should-not-be-used",
    ]);
    expect(mockPublicUrl).toHaveBeenCalledTimes(1);
    expect(mockPublicUrl).toHaveBeenCalledWith("servicios/k.jpg");
  });

  it("cae al proxy /api/images si presignGet lanza (p.ej. STORAGE_* no configurado en dev)", async () => {
    mockPublicUrl.mockReturnValue(null);
    mockPresignGet.mockRejectedValue(new Error("STORAGE_ACCESS_KEY missing"));

    const result = await getServiceImageUrlsResolved("servicios/2026/05/key.jpg");

    expect(result).toEqual(["/api/images/servicios/2026/05/key.jpg"]);
  });
});
