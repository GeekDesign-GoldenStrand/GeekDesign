/**
 * @jest-environment jsdom
 *
 * ST-19 — download button visibility on the storefront tracker page.
 *
 * The component is heavy (framer-motion, useRouter, modal state); we mock
 * only what's needed for a render and assert on the download link's presence
 * and href.
 */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import { QuotationDetailView } from "@/components/storefront/organisms/QuotationDetailView";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}));

// framer-motion's animation API on jsdom is noisy; replace `motion.X` with the
// underlying tag so rendering doesn't try to schedule animations we can't observe.
jest.mock("framer-motion", () => ({
  motion: new Proxy(
    {},
    {
      get: (_, tag: string) => {
        function MotionStub({
          children,
          ...props
        }: React.PropsWithChildren<Record<string, unknown>>) {
          const Tag = tag as unknown as React.ElementType;
          // Strip framer-only props (animate, initial, transition, etc.)
          const cleaned = Object.fromEntries(
            Object.entries(props).filter(
              ([k]) =>
                ![
                  "animate",
                  "initial",
                  "exit",
                  "transition",
                  "variants",
                  "whileHover",
                  "whileTap",
                ].includes(k)
            )
          );
          return <Tag {...cleaned}>{children}</Tag>;
        }
        return MotionStub;
      },
    }
  ),
  AnimatePresence: ({ children }: React.PropsWithChildren<unknown>) => <>{children}</>,
}));

// Module-level mock of FolioSearch — its internal hooks/fetches aren't relevant here.
jest.mock("@/components/storefront/organisms/FolioSearch", () => ({
  FolioSearch: () => null,
}));

const baseQuotation = {
  id_cotizacion: 42,
  folio: "GD-2026-00042",
  monto_total: 1180,
  fecha_creacion: new Date().toISOString(),
  notas: null,
  estatus: "Aprobada",
  cliente: { nombre_cliente: "Cliente Demo", empresa: "Demo Studio" },
  items: [
    {
      id: 1,
      nombre: "Corte Láser (Acrílico 3mm)",
      cantidad: 2,
      precio_unitario: 590,
      precio_total: 1180,
      precio_anterior: 1180,
      estado: "aceptado",
      descripcion: "Detalle del item",
    },
  ],
  pedido: { id_pedido: 100, estatus: "Pendiente", estado_factura: "Cotizacion" },
};

describe("QuotationDetailView — download PDF button (ST-19)", () => {
  it("ST19-C1: muestra el link de descarga cuando estatus === Aprobada", () => {
    render(<QuotationDetailView quotation={baseQuotation} />);
    const links = screen.getAllByRole("link", { name: /Descargar PDF/i });
    expect(links.length).toBeGreaterThan(0);
  });

  it("ST19-C1: href apunta a /api/storefront/cotizaciones/{folio}/pdf", () => {
    render(<QuotationDetailView quotation={baseQuotation} />);
    const links = screen.getAllByRole("link", { name: /Descargar PDF/i });
    for (const link of links) {
      expect(link).toHaveAttribute("href", "/api/storefront/cotizaciones/GD-2026-00042/pdf");
      expect(link).toHaveAttribute("download", "GD-2026-00042.pdf");
    }
  });

  it.each(["Pendiente", "Validada", "Rechazada", "Cancelada"])(
    "ST19-C1 (negative): el link NO se muestra cuando estatus = %s",
    (estatus) => {
      render(<QuotationDetailView quotation={{ ...baseQuotation, estatus }} />);
      expect(screen.queryByRole("link", { name: /Descargar PDF/i })).toBeNull();
    }
  );

  it("ST19-C1 (defensa): el link NO se muestra cuando folio es null aunque estatus sea Aprobada", () => {
    render(<QuotationDetailView quotation={{ ...baseQuotation, folio: null }} />);
    expect(screen.queryByRole("link", { name: /Descargar PDF/i })).toBeNull();
  });
});
