/**
 * @jest-environment node
 */
import { emailField, isValidEmail } from "@/lib/utils/email";

describe("isValidEmail", () => {
  describe("rechaza los casos documentados como inválidos", () => {
    it.each([
      ["sin dominio: pepe@", "pepe@"],
      ["dominio sin TLD: pepe@dominio", "pepe@dominio"],
      ["TLD de una sola letra: pepe@x.c", "pepe@x.c"],
      ["punto al inicio del local-part: .pepe@x.com", ".pepe@x.com"],
      ["puntos consecutivos en local-part: pepe..lopez@x.com", "pepe..lopez@x.com"],
    ])("rechaza %s", (_label, value) => {
      expect(isValidEmail(value)).toBe(false);
    });
  });

  describe("acepta direcciones bien formadas", () => {
    it.each([
      ["nombre@dominio.com", "nombre@dominio.com"],
      ["nombre+tag@dominio.mx", "nombre+tag@dominio.mx"],
    ])("acepta %s", (_label, value) => {
      expect(isValidEmail(value)).toBe(true);
    });
  });
});

describe("emailField", () => {
  it("rechaza las mismas direcciones que isValidEmail", () => {
    const schema = emailField();

    for (const invalid of [
      "pepe@",
      "pepe@dominio",
      "pepe@x.c",
      ".pepe@x.com",
      "pepe..lopez@x.com",
    ]) {
      expect(schema.safeParse(invalid).success).toBe(false);
    }
  });

  it("acepta direcciones válidas", () => {
    const schema = emailField();

    expect(schema.safeParse("nombre@dominio.com").success).toBe(true);
    expect(schema.safeParse("nombre+tag@dominio.mx").success).toBe(true);
  });

  it("respeta el límite max configurado", () => {
    const schema = emailField({ max: 20 });

    expect(schema.safeParse("nombre.muylargo@dominio.com").success).toBe(false);
  });
});
