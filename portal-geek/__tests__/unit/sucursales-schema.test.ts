/**
 * @jest-environment node
 */
import { CreateSucursalSchema } from "@/lib/schemas/sucursales";

describe("CreateSucursalSchema — dirección validation", () => {
  const basePayload = {
    nombre_sucursal: "Sucursal Test",
    horario_apertura: null,
    horario_salida: null,
    estatus: "Activo" as const,
  };

  it("accepts valid English and Spanish addresses under 255 characters", () => {
    const addresses = [
      "Calle Juárez #123, Col. Centro, CP 06000, CDMX",
      "Av. de la Constitución, 45 - 3º B",
      "123 Main Street, Suite 400",
      "Carretera Federal Km 45+500",
      "Dirección con tildes y eñes: Calle Niño Perdido, Bogotá",
    ];

    for (const address of addresses) {
      const result = CreateSucursalSchema.safeParse({
        ...basePayload,
        direccion: address,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects address longer than 255 characters", () => {
    const longAddress = "a".repeat(256);
    const result = CreateSucursalSchema.safeParse({
      ...basePayload,
      direccion: longAddress,
    });
    expect(result.success).toBe(false);
  });

  it("rejects address containing emojis", () => {
    const emojiAddresses = ["Calle 123 🏠", "Av. Principal 🇲🇽", "📍 Av. Reforma"];

    for (const address of emojiAddresses) {
      const result = CreateSucursalSchema.safeParse({
        ...basePayload,
        direccion: address,
      });
      expect(result.success).toBe(false);
    }
  });

  it("rejects address containing characters from other alphabets/scripts", () => {
    const foreignAddresses = [
      "Улица Ленина 10", // Cyrillic
      "北京市朝阳区建国门外大街", // Chinese
      "東京都新宿区西新宿", // Japanese
    ];

    for (const address of foreignAddresses) {
      const result = CreateSucursalSchema.safeParse({
        ...basePayload,
        direccion: address,
      });
      expect(result.success).toBe(false);
    }
  });
});
