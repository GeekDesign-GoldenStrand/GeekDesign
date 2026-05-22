import { metadata } from "@/app/(storefront)/tienda/promocionales/page";

describe("Promocionales Page Unit Tests", () => {
  it("should have correct SEO metadata", () => {
    expect(metadata).toBeDefined();
    // Brand suffix is applied globally via the root layout's
    // title template ("%s | Portal Geek"), not in each page's static title.
    expect(metadata.title).toContain("Productos Promocionales");
    expect(metadata.description).toBeDefined();
  });
});
