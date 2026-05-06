import { metadata } from "@/app/(storefront)/promocionales/page";

describe("Promocionales Page Unit Tests", () => {
  it("should have correct SEO metadata", () => {
    expect(metadata).toBeDefined();
    expect(metadata.title).toContain("Productos Promocionales");
    expect(metadata.title).toContain("Geek Design");
    expect(metadata.description).toBeDefined();
  });
});
