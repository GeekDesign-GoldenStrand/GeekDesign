import { buildKey, extFromFilename, extFromMime, STORAGE_CATEGORIES } from "@/lib/storage/keys";

describe("extFromMime", () => {
  it("maps known image mimes", () => {
    expect(extFromMime("image/jpeg")).toBe("jpg");
    expect(extFromMime("image/png")).toBe("png");
    expect(extFromMime("image/webp")).toBe("webp");
    expect(extFromMime("application/pdf")).toBe("pdf");
  });

  it("returns null for unknown mimes", () => {
    expect(extFromMime("application/x-msdownload")).toBeNull();
    expect(extFromMime("")).toBeNull();
  });
});

describe("extFromFilename", () => {
  it("extracts safe extensions", () => {
    expect(extFromFilename("photo.JPG")).toBe("jpg");
    expect(extFromFilename("doc.pdf")).toBe("pdf");
  });

  it("rejects missing or unsafe extensions", () => {
    expect(extFromFilename("noext")).toBeNull();
    expect(extFromFilename("evil.../etc/passwd")).toBeNull();
    expect(extFromFilename("a.tooooolong")).toBeNull();
  });
});

describe("buildKey", () => {
  it("produces category/yyyy/mm/uuid.ext", () => {
    const key = buildKey("materiales", "jpg");
    expect(key).toMatch(
      /^materiales\/\d{4}\/\d{2}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$/
    );
  });

  it("rejects unsafe extensions", () => {
    expect(() => buildKey("materiales", "../etc")).toThrow();
    expect(() => buildKey("materiales", "")).toThrow();
  });

  it("covers every declared category", () => {
    for (const cat of STORAGE_CATEGORIES) {
      expect(buildKey(cat, "png").startsWith(`${cat}/`)).toBe(true);
    }
  });
});
