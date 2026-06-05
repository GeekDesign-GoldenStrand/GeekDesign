/**
 * @jest-environment node
 */
import { AplicarDescuentoSchema, DISCOUNT_ERROR } from "@/lib/schemas/cotizaciones";

describe("AplicarDescuentoSchema", () => {
  it("acepta -20, -1, 1, y 20 (límites y valores válidos)", () => {
    expect(AplicarDescuentoSchema.parse({ porcentaje_descuento: -20 })).toEqual({
      porcentaje_descuento: -20,
    });
    expect(AplicarDescuentoSchema.parse({ porcentaje_descuento: -1 })).toEqual({
      porcentaje_descuento: -1,
    });
    expect(AplicarDescuentoSchema.parse({ porcentaje_descuento: 1 })).toEqual({
      porcentaje_descuento: 1,
    });
    expect(AplicarDescuentoSchema.parse({ porcentaje_descuento: 20 })).toEqual({
      porcentaje_descuento: 20,
    });
  });

  it("rechaza el valor 0", () => {
    const result = AplicarDescuentoSchema.safeParse({ porcentaje_descuento: 0 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(DISCOUNT_ERROR.ZERO);
    }
  });

  it("rechaza valores fuera de rango (< -20 o > 20)", () => {
    const tooLow = AplicarDescuentoSchema.safeParse({ porcentaje_descuento: -21 });
    expect(tooLow.success).toBe(false);
    if (!tooLow.success) {
      expect(tooLow.error.issues[0].message).toBe(DISCOUNT_ERROR.TOO_LOW);
    }

    const tooHigh = AplicarDescuentoSchema.safeParse({ porcentaje_descuento: 21 });
    expect(tooHigh.success).toBe(false);
    if (!tooHigh.success) {
      expect(tooHigh.error.issues[0].message).toBe(DISCOUNT_ERROR.TOO_HIGH);
    }
  });

  it("rechaza decimales", () => {
    const decimals = AplicarDescuentoSchema.safeParse({ porcentaje_descuento: 1.5 });
    expect(decimals.success).toBe(false);
    if (!decimals.success) {
      expect(decimals.error.issues[0].message).toBe(DISCOUNT_ERROR.NOT_INTEGER);
    }
  });

  it("acepta null para remover el ajuste", () => {
    expect(AplicarDescuentoSchema.parse({ porcentaje_descuento: null })).toEqual({
      porcentaje_descuento: null,
    });
  });
});
