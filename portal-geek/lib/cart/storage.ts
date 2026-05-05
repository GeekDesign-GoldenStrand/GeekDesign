const CART_KEY = "geekdesign_carrito";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MatrizEntry {
  cantidad_minima: number;
  cantidad_maxima: number | null;
  precio_unitario: number;
}

export interface CarritoItem {
  id: string;
  servicioId: number;
  nombreServicio: string;
  configuracion: Record<string, unknown>;
  cantidad: number;
  precioCalculado: number; // unit price
}

// ─── Read / Write ─────────────────────────────────────────────────────────────

export function getCarrito(): { items: CarritoItem[] } {
  if (typeof window === "undefined") return { items: [] };
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? (JSON.parse(raw) as { items: CarritoItem[] }) : { items: [] };
  } catch {
    return { items: [] };
  }
}

function saveCarrito(carrito: { items: CarritoItem[] }): void {
  localStorage.setItem(CART_KEY, JSON.stringify(carrito));
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function addItem(item: Omit<CarritoItem, "id">): { items: CarritoItem[] } {
  const carrito = getCarrito();
  const newItem: CarritoItem = { ...item, id: crypto.randomUUID() };
  const updated = { items: [...carrito.items, newItem] };
  saveCarrito(updated);
  return updated;
}

export function removeItem(itemId: string): { items: CarritoItem[] } {
  const carrito = getCarrito();
  const updated = { items: carrito.items.filter((i) => i.id !== itemId) };
  saveCarrito(updated);
  return updated;
}

export function updateQuantity(itemId: string, cantidad: number): { items: CarritoItem[] } {
  const carrito = getCarrito();
  const updated = {
    items: carrito.items.map((i) =>
      i.id === itemId ? { ...i, cantidad: Math.max(1, cantidad) } : i
    ),
  };
  saveCarrito(updated);
  return updated;
}

// ─── Computed ─────────────────────────────────────────────────────────────────

export function getSubtotal(items: CarritoItem[]): number {
  return items.reduce((sum, i) => sum + i.precioCalculado * i.cantidad, 0);
}

export function getTotalItems(items: CarritoItem[]): number {
  return items.reduce((sum, i) => sum + i.cantidad, 0);
}

// ─── Price lookup (client-side, uses pricing matrix passed as props) ──────────

export function calcularPrecioUnitario(
  selecciones: { opcionId: number; valorId: number }[],
  opcionesConMatriz: {
    id_opcion: number;
    valores: { id_valor: number; matriz: MatrizEntry[] }[];
  }[],
  cantidad: number
): number {
  const primera = selecciones[0];

  if (primera) {
    const opcion = opcionesConMatriz.find((o) => o.id_opcion === primera.opcionId);
    const valor = opcion?.valores.find((v) => v.id_valor === primera.valorId);

    if (valor) {
      const entry = valor.matriz
        .filter(
          (m) =>
            m.cantidad_minima <= cantidad &&
            (m.cantidad_maxima === null || m.cantidad_maxima >= cantidad)
        )
        .sort((a, b) => b.cantidad_minima - a.cantidad_minima)[0];

      if (entry) return entry.precio_unitario;
    }
  }

  // Fallback: cheapest available price at this quantity across all options
  const allPrices = opcionesConMatriz.flatMap((o) =>
    o.valores.flatMap((v) =>
      v.matriz
        .filter(
          (m) =>
            m.cantidad_minima <= cantidad &&
            (m.cantidad_maxima === null || m.cantidad_maxima >= cantidad)
        )
        .map((m) => m.precio_unitario)
    )
  );

  return allPrices.length > 0 ? Math.min(...allPrices) : 0;
}
