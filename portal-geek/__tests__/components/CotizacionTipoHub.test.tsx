/**
 * @jest-environment jsdom
 *
 * ST-10/11/12 — "¿No sabes qué quieres?" selection hub.
 * Verifies each option renders its heading and a button that redirects to the
 * correct solicitud form (the SRS *Salida* for each story).
 */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import { CotizacionTipoOption } from "@/components/storefront/molecules/CotizacionTipoOption";
import { CotizacionTipoHub } from "@/components/storefront/organisms/CotizacionTipoHub";

describe("CotizacionTipoHub", () => {
  it("ST10-C1: muestra las tres opciones de solicitud", () => {
    render(<CotizacionTipoHub />);

    expect(screen.getByRole("heading", { name: "No sé lo que quiero" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Tengo una idea" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Quiero algo específico" })).toBeInTheDocument();
  });

  it("ST10-C2: 'Aquí te guiamos' redirige al formulario de idea nula", () => {
    render(<CotizacionTipoHub />);
    expect(screen.getByRole("link", { name: "Aquí te guiamos" })).toHaveAttribute(
      "href",
      "/tienda/cotizacion/idea-nula"
    );
  });

  it("ST11-C1: 'Aquí lo hacemos realidad' redirige al formulario de idea vaga", () => {
    render(<CotizacionTipoHub />);
    expect(screen.getByRole("link", { name: "Aquí lo hacemos realidad" })).toHaveAttribute(
      "href",
      "/tienda/cotizacion/idea-vaga"
    );
  });

  it("ST12-C1: 'Aquí lo creamos' redirige al formulario de personalización", () => {
    render(<CotizacionTipoHub />);
    expect(screen.getByRole("link", { name: "Aquí lo creamos" })).toHaveAttribute(
      "href",
      "/tienda/cotizacion/personalizada"
    );
  });
});

describe("CotizacionTipoOption", () => {
  it("ST10-C3: usa la descripción por defecto cuando no se provee", () => {
    render(<CotizacionTipoOption titulo="Prueba" ctaLabel="Ir" href="/x" imageSide="left" />);
    expect(screen.getByText("Descripción")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir" })).toHaveAttribute("href", "/x");
  });
});
