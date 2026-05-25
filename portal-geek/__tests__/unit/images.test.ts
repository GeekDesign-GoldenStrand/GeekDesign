import { getServiceImageUrls } from "@/lib/utils/images";

describe("getServiceImageUrls helper", () => {
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
