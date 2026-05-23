import { SolicitarCotizacionSchema } from "@/lib/schemas/cotizaciones";

const baseItem = {
  id_servicio: 1,
  id_material: 1,
  cantidad: 2,
  variables: [{ nombre_variable: "ancho", valor: 50 }],
};

const baseCliente = {
  nombre_cliente: "Juan Pérez",
  correo_electronico: "juan@example.com",
  numero_telefono: "5511223344",
};

describe("SolicitarCotizacionSchema — disenio_key", () => {
  it("acepta un item sin disenio_key", () => {
    const result = SolicitarCotizacionSchema.safeParse({
      cliente: baseCliente,
      id_sucursal: 1,
      items: [baseItem],
    });
    expect(result.success).toBe(true);
  });

  it("acepta un item con disenio_key válido", () => {
    const key = "disenios/2026/05/550e8400-e29b-41d4-a716-446655440000.png";
    const result = SolicitarCotizacionSchema.safeParse({
      cliente: baseCliente,
      id_sucursal: 1,
      items: [{ ...baseItem, disenio_key: key }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items[0].disenio_key).toBe(key);
    }
  });

  it("rechaza un disenio_key que supera 500 caracteres", () => {
    const result = SolicitarCotizacionSchema.safeParse({
      cliente: baseCliente,
      id_sucursal: 1,
      items: [{ ...baseItem, disenio_key: "x".repeat(501) }],
    });
    expect(result.success).toBe(false);
  });

  it("rechaza un disenio_key de otra categoría (materiales/...)", () => {
    const result = SolicitarCotizacionSchema.safeParse({
      cliente: baseCliente,
      id_sucursal: 1,
      items: [
        {
          ...baseItem,
          disenio_key: "materiales/2026/05/00000000-0000-0000-0000-000000000001.png",
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("rechaza un disenio_key con formato arbitrario (sin UUID ni año/mes)", () => {
    const result = SolicitarCotizacionSchema.safeParse({
      cliente: baseCliente,
      id_sucursal: 1,
      items: [{ ...baseItem, disenio_key: "disenios/archivo.png" }],
    });
    expect(result.success).toBe(false);
  });

  it("preserva disenio_key en múltiples items de forma independiente", () => {
    const result = SolicitarCotizacionSchema.safeParse({
      cliente: baseCliente,
      id_sucursal: 1,
      items: [
        { ...baseItem, disenio_key: "disenios/2026/05/550e8400-e29b-41d4-a716-446655440001.svg" },
        { ...baseItem, id_servicio: 2 },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items[0].disenio_key).toBe(
        "disenios/2026/05/550e8400-e29b-41d4-a716-446655440001.svg"
      );
      expect(result.data.items[1].disenio_key).toBeUndefined();
    }
  });
});
