/**
 * @jest-environment node
 */

describe("Validaciones Numéricas en Inputs (RegEx)", () => {
  // ── Regex para inputs que permiten hasta 2 decimales ──────────
  // Utilizada en: FormulaVariablesForm, VariablesSection, ConstantesSection, etc.
  const decimalRegex = /^\d*\.?\d{0,2}$/;

  describe("Decimal Regex (hasta 2 decimales): /^\\d*\\.?\\d{0,2}$/", () => {
    it("acepta números enteros", () => {
      expect(decimalRegex.test("10")).toBe(true);
      expect(decimalRegex.test("1000")).toBe(true);
      expect(decimalRegex.test("0")).toBe(true);
    });

    it("acepta números con 1 o 2 decimales", () => {
      expect(decimalRegex.test("10.5")).toBe(true);
      expect(decimalRegex.test("10.50")).toBe(true);
      expect(decimalRegex.test("3.14")).toBe(true);
      expect(decimalRegex.test("0.01")).toBe(true);
      expect(decimalRegex.test(".99")).toBe(true);
    });

    it("rechaza números con más de 2 decimales", () => {
      expect(decimalRegex.test("10.555")).toBe(false);
      expect(decimalRegex.test("3.1415")).toBe(false);
      expect(decimalRegex.test("0.001")).toBe(false);
    });

    it("rechaza caracteres no numéricos y letras", () => {
      expect(decimalRegex.test("abc")).toBe(false);
      expect(decimalRegex.test("10a")).toBe(false);
      expect(decimalRegex.test("10,5")).toBe(false); // Coma en lugar de punto
      expect(decimalRegex.test("-10.50")).toBe(false); // Números negativos no permitidos
    });

    it("acepta cadena vacía (útil para borrar el input)", () => {
      expect(decimalRegex.test("")).toBe(true);
    });
  });

  // ── Regex para inputs estrictamente enteros (ej. Cantidad) ──────────
  // Utilizada en: CarritoView
  const integerRegex = /^\d+$/;

  describe("Integer Regex (solo enteros): /^\\d+$/", () => {
    it("acepta números enteros", () => {
      expect(integerRegex.test("10")).toBe(true);
      expect(integerRegex.test("1000")).toBe(true);
      expect(integerRegex.test("0")).toBe(true);
    });

    it("rechaza decimales", () => {
      expect(integerRegex.test("10.5")).toBe(false);
      expect(integerRegex.test("10.")).toBe(false);
    });

    it("rechaza caracteres no numéricos y signos", () => {
      expect(integerRegex.test("abc")).toBe(false);
      expect(integerRegex.test("-5")).toBe(false);
      expect(integerRegex.test("+5")).toBe(false);
    });

    it("rechaza cadena vacía (el input debe controlar esto antes de validar la cantidad)", () => {
      expect(integerRegex.test("")).toBe(false);
    });
  });
});
