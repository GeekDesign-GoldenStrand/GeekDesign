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
    const result = SolicitarCotizacionSchema.safeParse({
      cliente: baseCliente,
      id_sucursal: 1,
      items: [{ ...baseItem, disenio_key: "disenios/2026/05/abc-123.png" }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items[0].disenio_key).toBe("disenios/2026/05/abc-123.png");
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

  it("preserva disenio_key en múltiples items de forma independiente", () => {
    const result = SolicitarCotizacionSchema.safeParse({
      cliente: baseCliente,
      id_sucursal: 1,
      items: [
        { ...baseItem, disenio_key: "disenios/2026/05/a.svg" },
        { ...baseItem, id_servicio: 2 },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items[0].disenio_key).toBe("disenios/2026/05/a.svg");
      expect(result.data.items[1].disenio_key).toBeUndefined();
    }
  });
});
