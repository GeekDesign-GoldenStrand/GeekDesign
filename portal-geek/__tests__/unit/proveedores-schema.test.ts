/**
 * @jest-environment node
 */
import { CreateProveedorSchema, UBICACION_REGEX } from "@/lib/schemas/proveedores";

// ── Shared base (all required fields except the one under test) ───────────────
const BASE = {
  nombre_proveedor: "Empresa Test",
  tipo: "Proveedor de material",
  telefono: "4421234567",
  correo: "test@empresa.mx",
  estatus: "Activo" as const,
};

describe("CreateProveedorSchema — color", () => {
  it.each(["#3B82F6", "#000000", "#FFFFFF", "#aabbcc", "#A1B2C3"])(
    "accepts a valid 6-digit HEX color: %s",
    (color) => {
      expect(CreateProveedorSchema.safeParse({ ...BASE, color }).success).toBe(true);
    }
  );

  it.each([
    ["named color", "red"],
    ["named color", "blue"],
    ["empty string", ""],
    ["missing hash", "3B82F6"],
    ["3-digit shorthand", "#RGB"],
    ["8-digit with alpha", "#3B82F6FF"],
    ["invalid hex chars", "#GGGGGG"],
    ["space inside", "#3B82 F6"],
  ])("rejects an invalid color (%s): %s", (_label, color) => {
    const result = CreateProveedorSchema.safeParse({ ...BASE, color });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("El color debe ser un HEX válido (ej. #3B82F6).");
    }
  });
});

describe("UBICACION_REGEX", () => {
  it.each([
    "Monterrey, Nuevo León",
    "Querétaro, Querétaro",
    "San Pedro Garza García, Nuevo León",
    "Ciudad de México, CDMX",
    "León, Guanajuato",
  ])("accepts a valid 'Municipio, Estado' value: %s", (value) => {
    expect(UBICACION_REGEX.test(value)).toBe(true);
  });

  it.each([
    ["missing comma", "Querétaro"],
    ["digits", "111, 111"],
    ["emojis", "😀😀😀"],
    ["empty estado", "Querétaro,"],
    ["two commas", "Querétaro, Querétaro, México"],
    ["leading comma", ", Querétaro"],
  ])("rejects an invalid value (%s): %s", (_label, value) => {
    expect(UBICACION_REGEX.test(value)).toBe(false);
  });
});
