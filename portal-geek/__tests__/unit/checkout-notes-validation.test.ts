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

describe("SolicitarCotizacionSchema — notas validation", () => {
  it("acepta notas vacías o no proporcionadas", () => {
    const result = SolicitarCotizacionSchema.safeParse({
      cliente: baseCliente,
      id_sucursal: 1,
      items: [baseItem],
    });
    expect(result.success).toBe(true);
  });

  it("acepta notas válidas en español e inglés con puntuación común", () => {
    const validNotas = "Hola, esta es una nota válida. Hello! This is a valid note with standard punctuation: numbers 123, quotes 'test' & \"test\", symbols (€, $, %, &).";
    const result = SolicitarCotizacionSchema.safeParse({
      cliente: baseCliente,
      id_sucursal: 1,
      notas: validNotas,
      items: [baseItem],
    });
    expect(result.success).toBe(true);
  });

  it("rechaza notas que superen los 500 caracteres", () => {
    const longNotas = "a".repeat(501);
    const result = SolicitarCotizacionSchema.safeParse({
      cliente: baseCliente,
      id_sucursal: 1,
      notas: longNotas,
      items: [baseItem],
    });
    expect(result.success).toBe(false);
  });

  it("rechaza notas con emojis", () => {
    const result = SolicitarCotizacionSchema.safeParse({
      cliente: baseCliente,
      id_sucursal: 1,
      notas: "Nota con emoji 😊",
      items: [baseItem],
    });
    expect(result.success).toBe(false);
  });

  it("rechaza notas con caracteres de otros idiomas (ej. ruso, chino)", () => {
    const resultChinese = SolicitarCotizacionSchema.safeParse({
      cliente: baseCliente,
      id_sucursal: 1,
      notas: "这是一个测试",
      items: [baseItem],
    });
    expect(resultChinese.success).toBe(false);

    const resultRussian = SolicitarCotizacionSchema.safeParse({
      cliente: baseCliente,
      id_sucursal: 1,
      notas: "Привет",
      items: [baseItem],
    });
    expect(resultRussian.success).toBe(false);
  });
});
