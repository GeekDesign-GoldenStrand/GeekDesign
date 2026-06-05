/**
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CotizacionesTable } from "@/components/admin/organisms/CotizacionesTable";

// Track router.push so we can prove the row's goToDetail did NOT fire when
// the user picked a status from inside the StatusPill panel.
const pushMock = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

// The DesignFileLink molecule pulls in next/image + storage helpers that
// aren't relevant to this regression — stub it out so the test stays focused
// on the row → popover bubbling contract.
jest.mock("@/components/admin/molecules/DesignFileLink", () => ({
  __esModule: true,
  DesignFileLink: () => <div data-testid="design-file-link-stub" />,
}));

const sampleRow = {
  id_cotizacion: 42,
  fecha_creacion: "2026-06-01T00:00:00.000Z",
  monto_total: 1000,
  empresa: "ACME",
  cliente: "Jane",
  folio: "COT-042",
  nombre_oportunidad: "Test",
  estatus: "Pendiente",
  fecha_estimada: null,
  archivos: [],
};

describe("CotizacionesTable — picking a status inside the popover", () => {
  beforeEach(() => {
    pushMock.mockReset();
  });

  it("calls onStatusChange WITHOUT triggering row navigation", async () => {
    // This is the regression the user reported: before the fix, clicking
    // 'Validada' from the popover bubbled up to the row's onClick and
    // navigated to /cotizaciones/:id, dismissing the parent's confirm
    // dialog mid-render. The stopPropagation wrapper around the panel
    // must keep router.push from firing.
    const user = userEvent.setup();
    const onStatusChange = jest.fn();
    const onDelete = jest.fn();

    render(
      <CotizacionesTable
        cotizaciones={[sampleRow]}
        onDelete={onDelete}
        onStatusChange={onStatusChange}
      />
    );

    // Open the StatusPill popover by clicking the trigger labelled with the
    // current status. There are two triggers on the page (desktop + mobile
    // variants of the same row); both render — we just need one to open.
    const triggers = screen.getAllByRole("button", { name: /Pendiente/ });
    await user.click(triggers[0]);

    // Click 'Validada' inside the popover panel. The fix ensures the click
    // is swallowed at the panel wrapper so the row's onClick never fires.
    const validadaOption = await screen.findByRole("option", { name: "Validada" });
    await user.click(validadaOption);

    // The parent gets the picked status …
    expect(onStatusChange).toHaveBeenCalledWith(42, "Validada");
    // … but the row's goToDetail (router.push) MUST NOT have fired, or the
    // parent's confirm dialog would be torn down by the route change.
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("clicking the row chrome (outside the popover) still navigates", async () => {
    // Counter-test: the fix must NOT break the documented row-click → detail
    // navigation. Clicking the row's empty chrome should still call
    // router.push. Without this assertion, a future refactor could over-
    // stopPropagation everything and silently disable navigation.
    const user = userEvent.setup();
    render(
      <CotizacionesTable
        cotizaciones={[sampleRow]}
        onDelete={jest.fn()}
        onStatusChange={jest.fn()}
      />
    );

    // The desktop row sets aria-label="Ver detalle de la cotización COT-042";
    // click directly on the row container to exercise its onClick.
    const row = screen.getAllByRole("button", { name: /Ver detalle de la cotización COT-042/ })[0];
    await user.click(row);

    expect(pushMock).toHaveBeenCalledWith("/cotizaciones/42");
  });
});
