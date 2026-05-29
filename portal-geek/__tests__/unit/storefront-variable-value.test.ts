/**
 * Storefront variable-value validation. Both schemas must reject negative and
 * over-cap values so a curl/Postman bypass can't poison the cart with a
 * negative price (see lib/schemas/{servicios,cotizaciones}.ts and the
 * matching client guards in components/storefront/organisms/FormulaVariablesForm.tsx).
 */
import { SolicitarCotizacionSchema } from "@/lib/schemas/cotizaciones";
import { CalcularPrecioSchema } from "@/lib/schemas/servicios";

const baseCliente = {
  nombre_cliente: "Juan Pérez",
  correo_electronico: "juan@example.com",
  numero_telefono: "+524421234567",
};

const baseItem = {
  id_servicio: 1,
  id_material: 1,
  cantidad: 2,
  variables: [{ nombre_variable: "ancho", valor: 50 }],
};

describe("CalcularPrecioSchema — variable valor bounds", () => {
  const wrap = (valor: number) =>
    CalcularPrecioSchema.safeParse({
      id_material: 1,
      variables: [{ nombre_variable: "ancho", valor }],
    });

  it.each([1, 0.1, 50, 1000, 99999.99, 100000, 1_000_000, 99_999_999])(
    "acepta valor positivo dentro del rango: %s",
    (v) => {
      expect(wrap(v).success).toBe(true);
    }
  );

  it.each([0, -0.01, -1, -100, -99999])("rechaza valor cero o negativo: %s", (v) => {
    const r = wrap(v);
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => /mayor que 0/i.test(i.message))).toBe(true);
    }
  });

  it.each([99_999_999.01, 100_000_000, 1e10])(
    "rechaza valor por encima del tope (99999999): %s",
    (v) => {
      const r = wrap(v);
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(r.error.issues.some((i) => /demasiado grande/i.test(i.message))).toBe(true);
      }
    }
  );

  it("rechaza NaN / Infinity", () => {
    expect(wrap(NaN).success).toBe(false);
    expect(wrap(Infinity).success).toBe(false);
  });
});

describe("SolicitarCotizacionSchema — variable valor bounds (cart submit)", () => {
  const wrap = (valor: number) =>
    SolicitarCotizacionSchema.safeParse({
      cliente: baseCliente,
      id_sucursal: 1,
      items: [{ ...baseItem, variables: [{ nombre_variable: "ancho", valor }] }],
    });

  it("acepta valor positivo", () => {
    expect(wrap(50).success).toBe(true);
  });

  it("rechaza valor negativo (previene precio negativo en la cotización)", () => {
    const r = wrap(-10);
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => /mayor que 0/i.test(i.message))).toBe(true);
    }
  });

  it("rechaza valor por encima del tope", () => {
    const r = wrap(999999);
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => /demasiado grande/i.test(i.message))).toBe(true);
    }
  });

  it("rechaza valor cero (un 0 silenciosamente cero-iza el precio en la fórmula)", () => {
    expect(wrap(0).success).toBe(false);
  });
});
