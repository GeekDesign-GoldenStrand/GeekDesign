/**
 * @jest-environment node
 */
import { UBICACION_REGEX } from "@/lib/schemas/proveedores";

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
