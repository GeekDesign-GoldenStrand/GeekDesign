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
  numero_telefono: "+525511223344",
};

describe("SolicitarCotizacionSchema — fecha_estimada validation", () => {
  it("acepta hoy como fecha estimada", () => {
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0]; // YYYY-MM-DD

    const result = SolicitarCotizacionSchema.safeParse({
      cliente: baseCliente,
      id_sucursal: 1,
      fecha_estimada: dateStr,
      items: [baseItem],
    });
    expect(result.success).toBe(true);
  });

  it("acepta mañana como fecha estimada", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];

    const result = SolicitarCotizacionSchema.safeParse({
      cliente: baseCliente,
      id_sucursal: 1,
      fecha_estimada: dateStr,
      items: [baseItem],
    });
    expect(result.success).toBe(true);
  });

  it("rechaza una fecha del pasado (por ejemplo, hace 2 días)", () => {
    const past = new Date();
    past.setDate(past.getDate() - 2);
    const dateStr = past.toISOString().split("T")[0];

    const result = SolicitarCotizacionSchema.safeParse({
      cliente: baseCliente,
      id_sucursal: 1,
      fecha_estimada: dateStr,
      items: [baseItem],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.issues.map((e) => e.message);
      expect(errors).toContain("La fecha estimada no puede ser anterior a la fecha actual");
    }
  });

  it("acepta una fecha dentro de 1 año", () => {
    const oneYearOut = new Date();
    oneYearOut.setFullYear(oneYearOut.getFullYear() + 1);
    const dateStr = oneYearOut.toISOString().split("T")[0];

    const result = SolicitarCotizacionSchema.safeParse({
      cliente: baseCliente,
      id_sucursal: 1,
      fecha_estimada: dateStr,
      items: [baseItem],
    });
    expect(result.success).toBe(true);
  });

  it("acepta una fecha exactamente en 2 años", () => {
    const twoYearsOut = new Date();
    twoYearsOut.setFullYear(twoYearsOut.getFullYear() + 2);
    const dateStr = twoYearsOut.toISOString().split("T")[0];

    const result = SolicitarCotizacionSchema.safeParse({
      cliente: baseCliente,
      id_sucursal: 1,
      fecha_estimada: dateStr,
      items: [baseItem],
    });
    expect(result.success).toBe(true);
  });

  it("rechaza una fecha de más de 2 años (por ejemplo, 3 años)", () => {
    const threeYearsOut = new Date();
    threeYearsOut.setFullYear(threeYearsOut.getFullYear() + 3);
    const dateStr = threeYearsOut.toISOString().split("T")[0];

    const result = SolicitarCotizacionSchema.safeParse({
      cliente: baseCliente,
      id_sucursal: 1,
      fecha_estimada: dateStr,
      items: [baseItem],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.issues.map((e) => e.message);
      expect(errors).toContain("La fecha estimada no puede superar los 2 años a partir de hoy");
    }
  });
});
