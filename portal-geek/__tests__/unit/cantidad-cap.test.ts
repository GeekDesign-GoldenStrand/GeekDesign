/**
 * @jest-environment node
 *
 * Regression: the storefront cart's CANTIDAD_MAX, the server-side
 * SolicitarCotizacionSchema, and the server-side UpdateCotizacionSchema
 * must all share the same cap. A mismatch lets a customer submit a cart
 * the server rejects (or vice versa).
 */
import { CANTIDAD_MAX } from "@/lib/cart/storage";
import { SolicitarCotizacionSchema, UpdateCotizacionSchema } from "@/lib/schemas/cotizaciones";

const baseSolicitarPayload = (cantidad: number) => ({
  cliente: {
    nombre_cliente: "Cliente Prueba",
    correo_electronico: "cliente@example.com",
    numero_telefono: "5512345678",
  },
  id_sucursal: 1,
  fecha_estimada: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  items: [{ id_servicio: 1, id_material: 1, cantidad }],
});

const baseUpdatePayload = (cantidad: number) => ({
  servicios: [{ id_detalle: 1, cantidad, precio_unitario: 100 }],
});

describe("cantidad cap stays in sync across storefront and server", () => {
  it("CANTIDAD_MAX matches the submit-path schema cap", () => {
    expect(SolicitarCotizacionSchema.safeParse(baseSolicitarPayload(CANTIDAD_MAX)).success).toBe(
      true
    );
    expect(
      SolicitarCotizacionSchema.safeParse(baseSolicitarPayload(CANTIDAD_MAX + 1)).success
    ).toBe(false);
  });

  it("CANTIDAD_MAX matches the edit-path schema cap", () => {
    expect(UpdateCotizacionSchema.safeParse(baseUpdatePayload(CANTIDAD_MAX)).success).toBe(true);
    expect(UpdateCotizacionSchema.safeParse(baseUpdatePayload(CANTIDAD_MAX + 1)).success).toBe(
      false
    );
  });
});
