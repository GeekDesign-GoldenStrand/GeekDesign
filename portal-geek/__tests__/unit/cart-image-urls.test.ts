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

describe("CarritoItem — imagenUrls", () => {
  it("agrega un item sin imagenUrls", () => {
    const { items } = addItem(baseItem);
    expect(items[0].imagenUrls).toBeUndefined();
  });

  it("agrega un item con imagenUrls y lo persiste en localStorage", () => {
    const { items } = addItem({
      ...baseItem,
      imagenUrls: ["/api/images/img1.jpg", "/api/images/img2.jpg"],
    });
    expect(items[0].imagenUrls).toEqual(["/api/images/img1.jpg", "/api/images/img2.jpg"]);

    // sobrevive la serialización a JSON
    const raw = JSON.parse(localStorage.getItem("geekdesign_carrito")!);
    expect(raw.items[0].imagenUrls).toEqual(["/api/images/img1.jpg", "/api/images/img2.jpg"]);
  });

  it("clearCarrito elimina también los imagenUrls", () => {
    addItem({ ...baseItem, imagenUrls: ["/api/images/img1.jpg"] });
    clearCarrito();
    expect(getCarrito().items).toHaveLength(0);
  });
});
