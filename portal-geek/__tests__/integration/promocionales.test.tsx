import { listServicios } from "@/lib/services/servicios";
import StorefrontLayout from "@/app/(storefront)/layout";
import PromocionalesPage from "@/app/(storefront)/promocionales/page";

// Mock listServicios
jest.mock("@/lib/services/servicios", () => ({
  listServicios: jest.fn(),
}));

describe("Promocionales Integration Tests", () => {
  const mockListServicios = listServicios as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Storefront Layout Integration", () => {
    it("should handle successful category fetch", async () => {
      mockListServicios.mockResolvedValue({
        items: [{ id_servicio: 1, nombre_servicio: "Test Category" }],
        total: 1,
      });

      const result = await StorefrontLayout({ children: "content" });
      
      // Verify listServicios was called with correct parameters
      expect(mockListServicios).toHaveBeenCalledWith(1, 20, true);
      
      // Verify that the layout rendered (doesn't crash)
      expect(result).toBeDefined();
    });

    it("should handle database failure gracefully (Fallback)", async () => {
      // Simulate DB failure
      mockListServicios.mockRejectedValue(new Error("Database connection failed"));

      // Should NOT throw
      const result = await StorefrontLayout({ children: "content" });
      
      // Verify that it still renders despite the error
      expect(result).toBeDefined();
    });
  });

  describe("Promocionales Page Integration", () => {
    it("should render the Promocionales page component", async () => {
      const result = await PromocionalesPage();
      expect(result).toBeDefined();
    });
  });
});
