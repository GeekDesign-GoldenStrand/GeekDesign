/**
 * @jest-environment node
 */
import { addressOnly, noEmoji, textOnly } from "@/lib/schemas/text-validation";

describe("text-validation helpers", () => {
  describe("noEmoji", () => {
    it.each(["Sucursal Norte", "Diseño García #12", "Cliente O'Connor"])(
      "accepts plain English/Spanish text: %s",
      (value) => {
        expect(noEmoji(value)).toBe(true);
      }
    );

    it.each(["Sucursal 😀", "Promoción 🎉", "Casa 🏠"])(
      "rejects emoji presentation characters: %s",
      (value) => {
        expect(noEmoji(value)).toBe(false);
      }
    );
  });

  describe("textOnly", () => {
    it.each([
      "María José O'Connor",
      "Diseño & Corte #1",
      "Pedido urgente: 10 piezas; recoger 8:30",
      "¿Confirmado? ¡Sí!",
    ])("accepts English/Spanish text and common app punctuation: %s", (value) => {
      expect(textOnly(value)).toBe(true);
    });

    it.each([
      ["emoji", "Cliente 😀"],
      ["Cyrillic", "Москва"],
      ["Chinese", "北京"],
      ["angle brackets", "Cliente <script>"],
      ["pipe", "Nombre | alias"],
    ])("rejects %s: %s", (_label, value) => {
      expect(textOnly(value)).toBe(false);
    });
  });

  describe("addressOnly", () => {
    it.each([
      "Av. Constitución #45-3º B, Col. Centro",
      "Calle Niño Perdido 123, Bogotá",
      "Carretera Federal Km 45+500",
      "Blvrd Mediterráneo 236 B, Villa Corregidora, Qro.",
      "Local 2 @ Plaza Norte: acceso / estacionamiento",
    ])("accepts valid address characters: %s", (value) => {
      expect(addressOnly(value)).toBe(true);
    });

    it.each([
      ["emoji", "Calle 123 🏠"],
      ["Cyrillic", "Улица Ленина 10"],
      ["Japanese", "東京都新宿区西新宿"],
      ["curly braces", "Calle {Centro}"],
      ["pipe", "Calle A | Calle B"],
    ])("rejects %s: %s", (_label, value) => {
      expect(addressOnly(value)).toBe(false);
    });
  });
});
