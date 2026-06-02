/**
 * @jest-environment jsdom
 *
 * Tests for PedidoDetallesTable covering:
 *   - detalleIds filtering (show only clicked group, not all services)
 *   - variablesCotizacion display (etiqueta + valor + unidad)
 *   - fallback to fixed dimensions (ancho/alto/grosor + color)
 *   - service name label shown only when filtering is active
 *   - total reflects filtered items only
 */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import { PedidoDetallesTable } from "@/components/ui/pedidos/molecules/PedidoDetallesTable";
import type { PedidoLineItem } from "@/types/pedido";

// ─── Fixture helpers ──────────────────────────────────────────────────────────

function makeItem(
  overrides: Partial<PedidoLineItem> & Pick<PedidoLineItem, "id_detalle" | "id_servicio">
): PedidoLineItem {
  return {
    cantidad: 1,
    ancho_cm: null,
    alto_cm: null,
    grosor_cm: null,
    color: null,
    precio_unitario: "100.00",
    subtotal: "100.00",
    responsable_recoleccion: "cliente",
    notas: null,
    servicio: { nombre_servicio: "Impresión" },
    material: { nombre_material: "Vinilo" },
    archivo: {
      id_archivo: 1,
      nombre_archivo: "arte.pdf",
      url_archivo: "/arte.pdf",
      formato: "pdf",
    },
    estatus: null,
    variablesCotizacion: [],
    ...overrides,
  };
}

const ITEM_A = makeItem({
  id_detalle: 1,
  id_servicio: 10,
  servicio: { nombre_servicio: "Impresión" },
  subtotal: "200.00",
  precio_unitario: "200.00",
});

const ITEM_B = makeItem({
  id_detalle: 2,
  id_servicio: 20,
  servicio: { nombre_servicio: "Corte" },
  subtotal: "150.00",
  precio_unitario: "150.00",
});

const ITEM_C = makeItem({
  id_detalle: 3,
  id_servicio: 10,
  servicio: { nombre_servicio: "Impresión" },
  subtotal: "300.00",
  precio_unitario: "300.00",
});

const ALL_ITEMS = [ITEM_A, ITEM_B, ITEM_C];

// ─── Filtering ────────────────────────────────────────────────────────────────

describe("PedidoDetallesTable — detalleIds filtering", () => {
  it("shows all items when detalleIds is not provided", () => {
    render(<PedidoDetallesTable detalle={ALL_ITEMS} />);

    expect(screen.getAllByText("Impresión")).toHaveLength(2);
    expect(screen.getByText("Corte")).toBeInTheDocument();
  });

  it("shows only the item matching the given detalleId", () => {
    render(<PedidoDetallesTable detalle={ALL_ITEMS} detalleIds={[2]} />);

    expect(screen.queryByText("Impresión")).not.toBeInTheDocument();
    // "Corte" appears in both the service label and the table row — both are expected
    expect(screen.getAllByText("Corte").length).toBeGreaterThan(0);
  });

  it("shows multiple items when multiple detalleIds are given", () => {
    render(<PedidoDetallesTable detalle={ALL_ITEMS} detalleIds={[1, 2]} />);

    // label (span) + 1 table row — item 3 (id_detalle=3, also Impresión) is excluded
    expect(screen.getAllByText("Impresión")).toHaveLength(2);
    // Corte only appears once (table row only, label shows Impresión)
    expect(screen.getAllByText("Corte")).toHaveLength(1);
  });

  it("shows nothing in the tbody when no detalleIds match", () => {
    render(<PedidoDetallesTable detalle={ALL_ITEMS} detalleIds={[999]} />);

    expect(screen.queryByText("Impresión")).not.toBeInTheDocument();
    expect(screen.queryByText("Corte")).not.toBeInTheDocument();
  });
});

// ─── Total ────────────────────────────────────────────────────────────────────

describe("PedidoDetallesTable — total calculation", () => {
  it("sums all items when no filter is active", () => {
    // 200 + 150 + 300 = 650; Intl currency format is "$650.00" (no MXN suffix).
    render(<PedidoDetallesTable detalle={ALL_ITEMS} />);
    expect(screen.getByText("$650.00")).toBeInTheDocument();
  });

  it("sums only filtered items when detalleIds is set", () => {
    // detalleIds=[1] → only ITEM_A (200). Both the row subtotal and the table
    // total render "$200.00" now that Intl.NumberFormat is used consistently,
    // so assert *count* (one row cell + one total) instead of uniqueness.
    render(<PedidoDetallesTable detalle={ALL_ITEMS} detalleIds={[1]} />);
    const matches = screen.getAllByText("$200.00");
    expect(matches.length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("$650.00")).not.toBeInTheDocument();
  });
});

// ─── Service label ────────────────────────────────────────────────────────────

describe("PedidoDetallesTable — service label", () => {
  it("shows the service name label when detalleIds is set", () => {
    render(<PedidoDetallesTable detalle={ALL_ITEMS} detalleIds={[2]} />);
    // The label paragraph text is "Servicio: Corte"
    const label = screen.getByText(/^Servicio:/);
    expect(label).toBeInTheDocument();
    expect(label).toHaveTextContent("Corte");
  });

  it("does not show the service label when no filter is active", () => {
    render(<PedidoDetallesTable detalle={ALL_ITEMS} />);
    expect(screen.queryByText(/Servicio:/)).not.toBeInTheDocument();
  });
});

// ─── Especificaciones — variablesCotizacion ───────────────────────────────────

describe("PedidoDetallesTable — variablesCotizacion display", () => {
  it("renders etiqueta, valor and unidad for each variable", () => {
    const item = makeItem({
      id_detalle: 1,
      id_servicio: 10,
      variablesCotizacion: [
        {
          id_variable: 1,
          valor: "100",
          variable: { nombre_variable: "ancho", etiqueta: "Ancho", unidad: "cm" },
        },
        {
          id_variable: 2,
          valor: "50",
          variable: { nombre_variable: "alto", etiqueta: "Alto", unidad: "cm" },
        },
      ],
    });

    render(<PedidoDetallesTable detalle={[item]} />);

    expect(screen.getByText("Ancho:")).toBeInTheDocument();
    expect(screen.getByText("100 cm")).toBeInTheDocument();
    expect(screen.getByText("Alto:")).toBeInTheDocument();
    expect(screen.getByText("50 cm")).toBeInTheDocument();
  });

  it("renders valor without unit when unidad is null", () => {
    const item = makeItem({
      id_detalle: 1,
      id_servicio: 10,
      variablesCotizacion: [
        {
          id_variable: 1,
          valor: "4",
          variable: { nombre_variable: "colores", etiqueta: "Número de colores", unidad: null },
        },
      ],
    });

    render(<PedidoDetallesTable detalle={[item]} />);

    expect(screen.getByText("Número de colores:")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("shows — when valor is null", () => {
    const item = makeItem({
      id_detalle: 1,
      id_servicio: 10,
      variablesCotizacion: [
        {
          id_variable: 1,
          valor: null,
          variable: { nombre_variable: "ancho", etiqueta: "Ancho", unidad: "cm" },
        },
      ],
    });

    render(<PedidoDetallesTable detalle={[item]} />);

    expect(screen.getByText("— cm")).toBeInTheDocument();
  });
});

// ─── Especificaciones — fixed-field fallback ──────────────────────────────────

describe("PedidoDetallesTable — fixed-field fallback", () => {
  it("falls back to ancho/alto/grosor when variablesCotizacion is empty", () => {
    const item = makeItem({
      id_detalle: 1,
      id_servicio: 10,
      ancho_cm: "120",
      alto_cm: "80",
      grosor_cm: null,
      variablesCotizacion: [],
    });

    render(<PedidoDetallesTable detalle={[item]} />);

    expect(screen.getByText(/120 cm × 80 cm/)).toBeInTheDocument();
  });

  it("includes color in the fallback when no variables or dims are present", () => {
    const item = makeItem({
      id_detalle: 1,
      id_servicio: 10,
      color: "Rojo",
      variablesCotizacion: [],
    });

    render(<PedidoDetallesTable detalle={[item]} />);

    expect(screen.getByText("Color: Rojo")).toBeInTheDocument();
  });

  it("shows — when there are no variables, no dims, and no color", () => {
    const item = makeItem({ id_detalle: 1, id_servicio: 10 });

    render(<PedidoDetallesTable detalle={[item]} />);

    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("prefers variablesCotizacion over fixed dims when both are present", () => {
    const item = makeItem({
      id_detalle: 1,
      id_servicio: 10,
      ancho_cm: "120",
      variablesCotizacion: [
        {
          id_variable: 1,
          valor: "999",
          variable: { nombre_variable: "ancho", etiqueta: "Ancho especial", unidad: "cm" },
        },
      ],
    });

    render(<PedidoDetallesTable detalle={[item]} />);

    expect(screen.getByText("Ancho especial:")).toBeInTheDocument();
    // The fixed dim value should NOT appear since variables take precedence
    expect(screen.queryByText(/120 cm/)).not.toBeInTheDocument();
  });
});

// ─── Notes ────────────────────────────────────────────────────────────────────

describe("PedidoDetallesTable — notes", () => {
  it("renders notes under the service name when present", () => {
    const item = makeItem({
      id_detalle: 1,
      id_servicio: 10,
      notas: "Entregar doblado",
    });

    render(<PedidoDetallesTable detalle={[item]} />);

    expect(screen.getByText("Entregar doblado")).toBeInTheDocument();
  });

  it("does not render the notes text when notas is null", () => {
    const item = makeItem({ id_detalle: 1, id_servicio: 10, notas: null });

    render(<PedidoDetallesTable detalle={[item]} />);

    // The only italic element would come from a non-null notas — none here
    expect(document.querySelector("p.italic")).toBeNull();
  });
});
