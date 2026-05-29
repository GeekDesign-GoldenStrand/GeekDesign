import { MAX_QUOTE_ITEM_QUANTITY } from "@/lib/constants/cotizaciones";

const CART_KEY = "geekdesign_carrito";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VariableValor {
  id_variable: number;
  nombre_variable: string;
  etiqueta: string;
  unidad: string | null;
  valor: number;
}

export interface CarritoConfiguracion {
  variables: VariableValor[];
  notas?: string;
}

export interface CarritoItem {
  id: string;
  servicioId: number;
  nombreServicio: string;
  id_material: number;
  nombreMaterial: string;
  configuracion: CarritoConfiguracion;
  cantidad: number;
  precioCalculado: number;
  // Storage key of the design file uploaded by the client (disenios/ prefix).
  // Saved here so the checkout flow can reference it when creating ArchivosDisenio.
  disenioKey?: string;
  // Original filename as entered by the user (e.g. "logo_cliente.ai").
  // Persisted alongside the key so ArchivosDisenio.nombre_archivo is human-readable.
  disenioNombre?: string;
  // URLs or keys of service images to show as preview in the cart
  imagenUrls?: string[];
}

// ─── Read / Write ─────────────────────────────────────────────────────────────

export function getCarrito(): { items: CarritoItem[] } {
  if (typeof window === "undefined") return { items: [] };
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return { items: [] };
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      Array.isArray((parsed as { items?: unknown }).items)
    ) {
      return parsed as { items: CarritoItem[] };
    }
    return { items: [] };
  } catch {
    return { items: [] };
  }
}

function saveCarrito(carrito: { items: CarritoItem[] }): void {
  localStorage.setItem(CART_KEY, JSON.stringify(carrito));
}

export function clearCarrito(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CART_KEY);
}

// ─── Mutations ────────────────────────────────────────────────────────────────

function normalizeQuoteItemQuantity(cantidad: number): number {
  if (!Number.isFinite(cantidad)) return 1;

  return Math.min(MAX_QUOTE_ITEM_QUANTITY, Math.max(1, Math.floor(cantidad)));
}

export function addItem(item: Omit<CarritoItem, "id">): { items: CarritoItem[] } {
  const carrito = getCarrito();
  const newItem: CarritoItem = {
    ...item,
    id: crypto.randomUUID(),
    cantidad: normalizeQuoteItemQuantity(item.cantidad),
  };
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
  const safe = normalizeQuoteItemQuantity(cantidad);
  const carrito = getCarrito();
  const updated = {
    items: carrito.items.map((i) => (i.id === itemId ? { ...i, cantidad: safe } : i)),
  };
  saveCarrito(updated);
  return updated;
}

export function updateItem(
  itemId: string,
  patch: {
    configuracion: CarritoConfiguracion;
    id_material: number;
    nombreMaterial: string;
    cantidad: number;
    precioCalculado: number;
  }
): { items: CarritoItem[] } {
  const safeCantidad = normalizeQuoteItemQuantity(patch.cantidad);
  const safePrecio = Number.isFinite(patch.precioCalculado)
    ? Math.max(0, patch.precioCalculado)
    : 0;
  const carrito = getCarrito();
  const updated = {
    items: carrito.items.map((i) =>
      i.id === itemId
        ? {
            ...i,
            configuracion: patch.configuracion,
            id_material: patch.id_material,
            nombreMaterial: patch.nombreMaterial,
            cantidad: safeCantidad,
            precioCalculado: safePrecio,
          }
        : i
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
