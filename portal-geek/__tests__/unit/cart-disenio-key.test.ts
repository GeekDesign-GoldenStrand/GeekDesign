/**
 * @jest-environment jsdom
 */
import { addItem, clearCarrito, getCarrito } from "@/lib/cart/storage";

const baseItem = {
  servicioId: 1,
  nombreServicio: "Corte Láser",
  id_material: 1,
  nombreMaterial: "MDF 3mm",
  configuracion: { variables: [] },
  cantidad: 1,
  precioCalculado: 100,
};

beforeEach(() => {
  localStorage.clear();
});

describe("CarritoItem — disenioKey", () => {
  it("agrega un item sin disenioKey", () => {
    const { items } = addItem(baseItem);
    expect(items[0].disenioKey).toBeUndefined();
  });

  it("agrega un item con disenioKey y lo persiste en localStorage", () => {
    const { items } = addItem({ ...baseItem, disenioKey: "disenios/2026/05/abc.ai" });
    expect(items[0].disenioKey).toBe("disenios/2026/05/abc.ai");

    // sobrevive la serialización a JSON
    const raw = JSON.parse(localStorage.getItem("geekdesign_carrito")!);
    expect(raw.items[0].disenioKey).toBe("disenios/2026/05/abc.ai");
  });

  it("items con y sin disenioKey coexisten en el mismo carrito", () => {
    addItem(baseItem);
    addItem({ ...baseItem, servicioId: 2, disenioKey: "disenios/2026/05/logo.svg" });

    const { items } = getCarrito();
    expect(items).toHaveLength(2);
    expect(items[0].disenioKey).toBeUndefined();
    expect(items[1].disenioKey).toBe("disenios/2026/05/logo.svg");
  });

  it("clearCarrito elimina también los disenioKeys", () => {
    addItem({ ...baseItem, disenioKey: "disenios/2026/05/abc.png" });
    clearCarrito();
    expect(getCarrito().items).toHaveLength(0);
  });
});
