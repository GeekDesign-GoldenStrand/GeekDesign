import PromocionalesPage from "@/app/(storefront)/promocionales/page";

describe("Promocionales Integration Tests", () => {
  // Storefront Layout no longer fetches categories, so layout-specific data tests are removed.

  describe("Promocionales Page Integration", () => {
    it("should render the Promocionales page component", async () => {
      const result = await PromocionalesPage();
      expect(result).toBeDefined();
    });
  });
});
