/**
 * @jest-environment jsdom
 *
 * Locks in the draft-and-apply contract that every `*FilterSidebar` follows:
 *
 *   1. Opening the sidebar resyncs the local draft from the currently applied
 *      filters (so abandoned edits don't leak across reopens).
 *   2. Typing into a field never touches the parent's applied state — the
 *      list shouldn't re-filter until the user explicitly commits.
 *   3. Clicking Aplicar pushes every draft value to the parent setters.
 *   4. Closing without Aplicar discards the draft; the next open shows the
 *      last applied values, not the abandoned edits.
 *
 * The whole point of the pattern is to avoid live-filtering — easy to
 * regress with a stray `onChange` wired to the parent setter. SucursalesFilterSidebar
 * stands in for the family (Cotizaciones/Pedidos share the exact same
 * prevOpen-during-render trick).
 */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";

import { SucursalesFilterSidebar } from "@/components/admin/organisms/SucursalesFilterSidebar";

// Minimal harness mirroring how the real templates wire the sidebar — owns the
// applied filter state and a `setOpen` so individual tests can drive the
// open/close transitions that exercise the prevOpen reseed branch.
function Harness({
  initialNombre = "",
  initialDireccion = "",
  initialEstatus = [] as string[],
  initiallyOpen = true,
}: {
  initialNombre?: string;
  initialDireccion?: string;
  initialEstatus?: string[];
  initiallyOpen?: boolean;
}) {
  const [open, setOpen] = useState(initiallyOpen);
  const [nombre, setNombre] = useState(initialNombre);
  const [direccion, setDireccion] = useState(initialDireccion);
  const [estatus, setEstatus] = useState<string[]>(initialEstatus);

  return (
    <div>
      {/* Mirror back the applied state so tests can assert on it without
          reaching into React internals. */}
      <div data-testid="applied-nombre">{nombre}</div>
      <div data-testid="applied-direccion">{direccion}</div>
      <div data-testid="applied-estatus">{estatus.join(",")}</div>

      <button type="button" onClick={() => setOpen(true)}>
        open-from-test
      </button>

      <SucursalesFilterSidebar
        open={open}
        onClose={() => setOpen(false)}
        filterNombre={nombre}
        setFilterNombre={setNombre}
        filterDireccion={direccion}
        setFilterDireccion={setDireccion}
        filterEstatus={estatus}
        setFilterEstatus={setEstatus}
      />
    </div>
  );
}

// Helper — the sidebar renders three labelled controls. Pulling them this way
// keeps each test readable and surfaces a clear error if the markup changes.
function getNombreInput() {
  return screen.getByText("Nombre sucursal").nextElementSibling as HTMLInputElement;
}
function getDireccionInput() {
  return screen.getByText("Dirección").nextElementSibling as HTMLInputElement;
}
function getEstatusCheckbox(label: "Activo" | "Inactivo") {
  return screen.getByLabelText(label) as HTMLInputElement;
}

describe("SucursalesFilterSidebar — draft / Aplicar contract", () => {
  it("opening syncs the draft from the currently applied filters", async () => {
    // Start closed with a non-empty applied set so we can verify the
    // closed→open transition is what populates the inputs (not the initial
    // useState seed, which would mask a regression).
    const user = userEvent.setup();
    render(
      <Harness
        initiallyOpen={false}
        initialNombre="Centro"
        initialDireccion="Reforma 100"
        initialEstatus={["Activo"]}
      />
    );

    await user.click(screen.getByRole("button", { name: "open-from-test" }));

    expect(getNombreInput()).toHaveValue("Centro");
    expect(getDireccionInput()).toHaveValue("Reforma 100");
    expect(getEstatusCheckbox("Activo")).toBeChecked();
    expect(getEstatusCheckbox("Inactivo")).not.toBeChecked();
  });

  it("typing into a field does not mutate the applied state", async () => {
    const user = userEvent.setup();
    render(<Harness initialNombre="seed" />);

    await user.clear(getNombreInput());
    await user.type(getNombreInput(), "draft-only");
    await user.click(getEstatusCheckbox("Inactivo"));

    // Draft moved…
    expect(getNombreInput()).toHaveValue("draft-only");
    expect(getEstatusCheckbox("Inactivo")).toBeChecked();
    // …but the parent's applied snapshot stayed put.
    expect(screen.getByTestId("applied-nombre")).toHaveTextContent("seed");
    expect(screen.getByTestId("applied-estatus")).toHaveTextContent("");
  });

  it("clicking Aplicar pushes every draft value to the parent setters", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(getNombreInput(), "Norte");
    await user.type(getDireccionInput(), "Av. Mariano");
    await user.click(getEstatusCheckbox("Activo"));
    await user.click(getEstatusCheckbox("Inactivo"));

    await user.click(screen.getByRole("button", { name: "Aplicar" }));

    expect(screen.getByTestId("applied-nombre")).toHaveTextContent("Norte");
    expect(screen.getByTestId("applied-direccion")).toHaveTextContent("Av. Mariano");
    // Set insertion order is preserved by useState, so the join order is
    // deterministic — Activo was clicked first.
    expect(screen.getByTestId("applied-estatus")).toHaveTextContent("Activo,Inactivo");
  });

  it("closing without Aplicar discards the draft; reopen shows applied values", async () => {
    const user = userEvent.setup();
    render(<Harness initialNombre="Original" initialEstatus={["Activo"]} />);

    // Make some edits, then bail out via the X (Cerrar filtros) button.
    await user.clear(getNombreInput());
    await user.type(getNombreInput(), "Throwaway");
    await user.click(getEstatusCheckbox("Activo")); // uncheck

    await user.click(screen.getByLabelText("Cerrar filtros"));

    // Applied state never changed — confirms the close path didn't smuggle
    // the draft through.
    expect(screen.getByTestId("applied-nombre")).toHaveTextContent("Original");
    expect(screen.getByTestId("applied-estatus")).toHaveTextContent("Activo");

    // Reopening must reseed the draft from the applied props, not preserve
    // the abandoned edits — this is exactly what the prevOpen guard buys us.
    await user.click(screen.getByRole("button", { name: "open-from-test" }));
    expect(getNombreInput()).toHaveValue("Original");
    expect(getEstatusCheckbox("Activo")).toBeChecked();
  });
});
