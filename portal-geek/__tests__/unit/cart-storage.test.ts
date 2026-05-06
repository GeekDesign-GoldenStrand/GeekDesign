/**
 * @jest-environment jsdom
 */
import {
  getCarrito,
  addItem,
  removeItem,
  updateQuantity,
  getSubtotal,
  getTotalItems,
  calcularPrecioUnitario,
} from "@/lib/cart/storage";

const mockItem = {
  servicioId: 1,
  nombreServicio: "Corte Láser",
  configuracion: { selecciones: [{ opcionId: 1, valorId: 2 }] },
  cantidad: 3,
  precioCalculado: 50,
};

const opcionesConMatriz = [
  {
    id_opcion: 1,
    valores: [
      {
        id_valor: 2,
        matriz: [
          { cantidad_minima: 1, cantidad_maxima: 10, precio_unitario: 80 },
          { cantidad_minima: 11, cantidad_maxima: null, precio_unitario: 60 },
        ],
      },
    ],
  },
];

beforeEach(() => {
  localStorage.clear();
});

describe("getCarrito", () => {
  it("retorna carrito vacío cuando localStorage está limpio", () => {
    expect(getCarrito()).toEqual({ items: [] });
  });

  it("retorna el carrito guardado en localStorage", () => {
    localStorage.setItem(
      "geekdesign_carrito",
      JSON.stringify({ items: [{ ...mockItem, id: "x" }] })
    );
    expect(getCarrito().items).toHaveLength(1);
  });

  it("retorna carrito vacío si el JSON está corrupto", () => {
    localStorage.setItem("geekdesign_carrito", "invalid-json{{");
    expect(getCarrito()).toEqual({ items: [] });
  });
});

describe("addItem", () => {
  it("agrega un item y le asigna un id", () => {
    const result = addItem(mockItem);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBeTruthy();
    expect(result.items[0].servicioId).toBe(1);
  });

  it("acumula múltiples items", () => {
    addItem(mockItem);
    const result = addItem({ ...mockItem, servicioId: 2 });
    expect(result.items).toHaveLength(2);
  });

  it("persiste el carrito en localStorage", () => {
    addItem(mockItem);
    const raw = localStorage.getItem("geekdesign_carrito");
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw!).items).toHaveLength(1);
  });
});

describe("removeItem", () => {
  it("elimina el item por id", () => {
    const { items } = addItem(mockItem);
    const result = removeItem(items[0].id);
    expect(result.items).toHaveLength(0);
  });

  it("no modifica otros items al eliminar uno", () => {
    addItem(mockItem);
    const { items } = addItem({ ...mockItem, servicioId: 2 });
    const idToRemove = items[0].id;

    const result = removeItem(idToRemove);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).not.toBe(idToRemove);
  });

  it("no lanza error al eliminar un id inexistente", () => {
    addItem(mockItem);
    const result = removeItem("id-inexistente");
    expect(result.items).toHaveLength(1);
  });
});

describe("updateQuantity", () => {
  it("actualiza la cantidad de un item por id", () => {
    const { items } = addItem(mockItem);
    const result = updateQuantity(items[0].id, 5);
    expect(result.items[0].cantidad).toBe(5);
  });

  it("clampea a mínimo 1 si el valor es menor que 1", () => {
    const { items } = addItem(mockItem);
    const result = updateQuantity(items[0].id, 0);
    expect(result.items[0].cantidad).toBe(1);
  });

  it("normaliza NaN a 1", () => {
    const { items } = addItem(mockItem);
    const result = updateQuantity(items[0].id, NaN);
    expect(result.items[0].cantidad).toBe(1);
  });

  it("persiste el cambio en localStorage", () => {
    const { items } = addItem(mockItem);
    updateQuantity(items[0].id, 7);
    const raw = localStorage.getItem("geekdesign_carrito");
    expect(JSON.parse(raw!).items[0].cantidad).toBe(7);
  });

  it("no modifica otros items al actualizar uno", () => {
    addItem(mockItem);
    const { items } = addItem({ ...mockItem, servicioId: 2 });
    const idToUpdate = items[1].id;
    const result = updateQuantity(idToUpdate, 10);
    expect(result.items[0].cantidad).toBe(mockItem.cantidad);
    expect(result.items[1].cantidad).toBe(10);
  });
});

describe("getSubtotal", () => {
  it("retorna 0 con lista vacía", () => {
    expect(getSubtotal([])).toBe(0);
  });

  it("calcula correctamente precioCalculado × cantidad por cada item", () => {
    const items = [
      { ...mockItem, id: "a", precioCalculado: 50, cantidad: 3 },
      { ...mockItem, id: "b", precioCalculado: 100, cantidad: 2 },
    ];
    expect(getSubtotal(items)).toBe(350); // 150 + 200
  });
});

describe("getTotalItems", () => {
  it("retorna 0 con lista vacía", () => {
    expect(getTotalItems([])).toBe(0);
  });

  it("suma las cantidades de todos los items", () => {
    const items = [
      { ...mockItem, id: "a", cantidad: 3 },
      { ...mockItem, id: "b", cantidad: 2 },
    ];
    expect(getTotalItems(items)).toBe(5);
  });
});

describe("calcularPrecioUnitario", () => {
  it("retorna precio del tramo correcto según cantidad", () => {
    const precio = calcularPrecioUnitario([{ opcionId: 1, valorId: 2 }], opcionesConMatriz, 5);
    expect(precio).toBe(80); // tramo 1–10
  });

  it("aplica tramo de mayoreo cuando la cantidad supera el mínimo", () => {
    const precio = calcularPrecioUnitario([{ opcionId: 1, valorId: 2 }], opcionesConMatriz, 15);
    expect(precio).toBe(60); // tramo 11+
  });

  it("retorna 0 si no hay precios disponibles para esa cantidad", () => {
    const precio = calcularPrecioUnitario([{ opcionId: 1, valorId: 2 }], opcionesConMatriz, 0);
    expect(precio).toBe(0);
  });

  it("usa fallback al precio más barato si la selección no tiene precio", () => {
    const precio = calcularPrecioUnitario(
      [{ opcionId: 99, valorId: 99 }], // opción inexistente
      opcionesConMatriz,
      5
    );
    expect(precio).toBe(80); // precio más barato disponible en el tramo
  });

  it("retorna 0 si no hay opciones", () => {
    const precio = calcularPrecioUnitario([], [], 1);
    expect(precio).toBe(0);
  });
});
