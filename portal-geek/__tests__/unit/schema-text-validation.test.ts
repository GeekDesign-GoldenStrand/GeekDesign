/**
 * @jest-environment node
 */
import { CreateClienteSchema } from "@/lib/schemas/clientes";
import { CreateCotizacionSchema } from "@/lib/schemas/cotizaciones";
import { CreateProveedorSchema } from "@/lib/schemas/proveedores";

const clienteBase = {
  nombre_cliente: "María José",
  empresa: "Diseño & Corte #1",
  correo_electronico: "cliente@empresa.mx",
  numero_telefono: "4421234567",
};

const proveedorBase = {
  nombre_proveedor: "Proveedor Ñandú",
  tipo: "Proveedor de material",
  telefono: "4421234567",
  correo: "proveedor@empresa.mx",
  color: "#3B82F6",
};

describe("representative schemas — shared text validation", () => {
  describe("CreateClienteSchema", () => {
    it("accepts Spanish names and common business punctuation", () => {
      expect(CreateClienteSchema.safeParse(clienteBase).success).toBe(true);
    });

    it.each([
      ["emoji in name", { nombre_cliente: "María 😀" }],
      ["foreign script in company", { empresa: "北京 Design" }],
      ["blocked punctuation in company", { empresa: "Cliente <script>" }],
    ])("rejects %s", (_label, override) => {
      expect(CreateClienteSchema.safeParse({ ...clienteBase, ...override }).success).toBe(false);
    });
  });

  describe("CreateProveedorSchema", () => {
    it("accepts Spanish provider names and address punctuation", () => {
      const result = CreateProveedorSchema.safeParse({
        ...proveedorBase,
        ubicacion: "Av. Universidad #100, Col. Centro, Local 2 @ Plaza Norte",
      });

      expect(result.success).toBe(true);
    });

    it.each([
      ["emoji in name", { nombre_proveedor: "Proveedor 😀" }],
      ["foreign script in address", { ubicacion: "東京都新宿区西新宿" }],
      ["blocked address punctuation", { ubicacion: "Calle A | Calle B" }],
    ])("rejects %s", (_label, override) => {
      expect(CreateProveedorSchema.safeParse({ ...proveedorBase, ...override }).success).toBe(
        false
      );
    });
  });

  describe("CreateCotizacionSchema", () => {
    const cotizacionBase = {
      id_cliente: 1,
      monto_total: 1500,
    };

    it("accepts Spanish company names and note punctuation", () => {
      const result = CreateCotizacionSchema.safeParse({
        ...cotizacionBase,
        empresa_cliente: "Bordados García & Co.",
        notas: "Entrega: martes, 10:00; urgente #12",
      });

      expect(result.success).toBe(true);
    });

    it.each([
      ["emoji in notes", { notas: "Entregar rápido 😀" }],
      ["foreign script in company", { empresa_cliente: "Москва Print" }],
      ["blocked punctuation in notes", { notas: "Revisar <script>" }],
    ])("rejects %s", (_label, override) => {
      expect(CreateCotizacionSchema.safeParse({ ...cotizacionBase, ...override }).success).toBe(
        false
      );
    });
  });
});
