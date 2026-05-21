/**
 * @jest-environment jsdom
 */
import {
  addItem,
  clearCarrito,
  getCarrito,
  getSubtotal,
  getTotalItems,
  removeItem,
  updateItem,
  updateQuantity,
  type CarritoConfiguracion,
} from "@/lib/cart/storage";

const variablesDefault: CarritoConfiguracion = {
  variables: [
    {
      id_variable: 1,
      nombre_variable: "ancho",
      etiqueta: "Ancho (cm)",
      unidad: "cm",
      valor: 50,
    },
    {
      id_variable: 2,
      nombre_variable: "alto",
      etiqueta: "Alto (cm)",
      unidad: "cm",
      valor: 30,
    },
  ],
};

const mockItem = {
  servicioId: 1,
  nombreServicio: "Corte Láser",
  id_material: 1,
  nombreMaterial: "MDF 3mm",
  configuracion: variablesDefault,
  cantidad: 3,
  precioCalculado: 50,
};

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

describe("clearCarrito", () => {
  it("vacía el carrito en localStorage", () => {
    addItem(mockItem);
    expect(getCarrito().items).toHaveLength(1);
    clearCarrito();
    expect(getCarrito().items).toHaveLength(0);
  });
});

describe("addItem", () => {
  it("agrega un item y le asigna un id", () => {
    const result = addItem(mockItem);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBeTruthy();
    expect(result.items[0].servicioId).toBe(1);
    expect(result.items[0].id_material).toBe(1);
    expect(result.items[0].nombreMaterial).toBe("MDF 3mm");
    expect(result.items[0].configuracion.variables).toHaveLength(2);
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
});

describe("updateItem", () => {
  it("actualiza configuracion, material, cantidad y precioCalculado", () => {
    const { items } = addItem(mockItem);
    const newConfig: CarritoConfiguracion = {
      variables: [
        {
          id_variable: 1,
          nombre_variable: "ancho",
          etiqueta: "Ancho (cm)",
          unidad: "cm",
          valor: 100,
        },
      ],
    };
    const result = updateItem(items[0].id, {
      configuracion: newConfig,
      id_material: 2,
      nombreMaterial: "Acrílico 3mm",
      cantidad: 10,
      precioCalculado: 60,
    });
    expect(result.items[0].cantidad).toBe(10);
    expect(result.items[0].precioCalculado).toBe(60);
    expect(result.items[0].id_material).toBe(2);
    expect(result.items[0].nombreMaterial).toBe("Acrílico 3mm");
    expect(result.items[0].configuracion).toEqual(newConfig);
  });

  it("no lanza error al actualizar un id inexistente", () => {
    addItem(mockItem);
    const result = updateItem("id-inexistente", {
      configuracion: { variables: [] },
      id_material: 1,
      nombreMaterial: "X",
      cantidad: 1,
      precioCalculado: 0,
    });
    expect(result.items).toHaveLength(1);
    expect(result.items[0].precioCalculado).toBe(mockItem.precioCalculado);
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
    expect(getSubtotal(items)).toBe(350);
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
