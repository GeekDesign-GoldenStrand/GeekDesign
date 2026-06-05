/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import CotizacionesPage from "@/app/(admin)/cotizaciones/page";

// Stub the heavy template tree — we only care that the page-level
// status-change flow gates on the ConfirmDialog. The template just needs to
// surface a callable trigger that mimics the StatusPill's onChange.
jest.mock("@/components/admin/templates/CotizacionesTemplate", () => ({
  __esModule: true,
  CotizacionesTemplate: ({
    cotizaciones,
    onStatusChange,
  }: {
    cotizaciones: { id_cotizacion: number; estatus: string; folio: string | null }[];
    onStatusChange: (id: number, status: string) => void;
  }) => (
    <div>
      {cotizaciones.map((c) => (
        <div key={c.id_cotizacion}>
          <span data-testid={`row-${c.id_cotizacion}-estatus`}>{c.estatus}</span>
          <button
            type="button"
            data-testid={`row-${c.id_cotizacion}-pick-validada`}
            onClick={() => onStatusChange(c.id_cotizacion, "Validada")}
          >
            Pick Validada
          </button>
          <button
            type="button"
            data-testid={`row-${c.id_cotizacion}-pick-rechazada`}
            onClick={() => onStatusChange(c.id_cotizacion, "Rechazada")}
          >
            Pick Rechazada
          </button>
        </div>
      ))}
    </div>
  ),
}));

// Minimal API response — one Pendiente row is enough to exercise the
// picker → confirm → PATCH flow.
const initialList = {
  data: [
    {
      id_cotizacion: 42,
      fecha_creacion: "2026-06-01T00:00:00.000Z",
      monto_total: "1000",
      empresa_cliente: "ACME",
      cliente: { empresa: "ACME", nombre_cliente: "Jane" },
      folio: "COT-042",
      nombre_oportunidad: "Test",
      estatus: { descripcion: "Pendiente" },
      fecha_fin: null,
      fecha_aprobacion: null,
      pedido: { detalles: [] },
    },
  ],
  total: 1,
};

function mockJsonResponse(body: unknown, init: { status?: number; ok?: boolean } = {}) {
  const status = init.status ?? 200;
  return {
    ok: init.ok ?? (status >= 200 && status < 300),
    status,
    json: async () => body,
  } as unknown as Response;
}

describe("CotizacionesPage status-change confirmation", () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    // Default: GET returns the initial list. Tests override per-call as needed.
    fetchMock.mockImplementation((input: string) => {
      if (input.startsWith("/api/cotizaciones?")) {
        return Promise.resolve(mockJsonResponse(initialList));
      }
      return Promise.resolve(mockJsonResponse({}));
    });
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("does NOT fire the PATCH when the user picks a status — confirm dialog opens first", async () => {
    const user = userEvent.setup();
    render(<CotizacionesPage />);

    // Wait for the row to render after the initial GET.
    await waitFor(() => expect(screen.getByTestId("row-42-estatus")).toBeInTheDocument());

    // Capture the PATCH count BEFORE we click — should be zero so far (only GETs).
    const patchCallsBefore = fetchMock.mock.calls.filter(
      ([, init]) => (init as RequestInit | undefined)?.method === "PATCH"
    ).length;
    expect(patchCallsBefore).toBe(0);

    await user.click(screen.getByTestId("row-42-pick-validada"));

    // Confirm dialog should have opened, and NO PATCH should have been fired yet.
    expect(screen.getByText(/Cambiar estatus a Validada/)).toBeInTheDocument();
    const patchCallsAfterPick = fetchMock.mock.calls.filter(
      ([, init]) => (init as RequestInit | undefined)?.method === "PATCH"
    ).length;
    expect(patchCallsAfterPick).toBe(0);
  });

  it("fires the PATCH with the picked status only after the user confirms", async () => {
    const user = userEvent.setup();
    // Set up: GET list, then PATCH succeeds, then GET refetch.
    fetchMock.mockImplementation((input: string, init?: RequestInit) => {
      if (init?.method === "PATCH") {
        return Promise.resolve(mockJsonResponse({}, { status: 200 }));
      }
      if (input.startsWith("/api/cotizaciones?")) {
        return Promise.resolve(mockJsonResponse(initialList));
      }
      return Promise.resolve(mockJsonResponse({}));
    });

    render(<CotizacionesPage />);
    await waitFor(() => expect(screen.getByTestId("row-42-estatus")).toBeInTheDocument());

    await user.click(screen.getByTestId("row-42-pick-rechazada"));

    // Dialog renders with the current → next text using captured currentStatus.
    expect(screen.getByText(/Cambiar estatus a Rechazada/)).toBeInTheDocument();
    const dialog = screen.getByText(/Esta cotización pasará de/).closest("div");
    expect(dialog).not.toBeNull();
    expect(dialog!.textContent).toContain("Pendiente");
    expect(dialog!.textContent).toContain("Rechazada");

    // Click the Confirm button in the dialog.
    await user.click(screen.getByRole("button", { name: "Confirmar" }));

    // PATCH should have been fired exactly once with the right URL + body.
    await waitFor(() => {
      const patchCalls = fetchMock.mock.calls.filter(
        ([, init]) => (init as RequestInit | undefined)?.method === "PATCH"
      );
      expect(patchCalls).toHaveLength(1);
      const [url, init] = patchCalls[0];
      expect(url).toBe("/api/cotizaciones/42/estatus");
      expect(JSON.parse((init as RequestInit).body as string)).toEqual({ estatus: "Rechazada" });
    });
  });

  it("does NOT fire the PATCH if the user cancels the dialog", async () => {
    const user = userEvent.setup();
    render(<CotizacionesPage />);
    await waitFor(() => expect(screen.getByTestId("row-42-estatus")).toBeInTheDocument());

    await user.click(screen.getByTestId("row-42-pick-validada"));
    expect(screen.getByText(/Cambiar estatus a Validada/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    // Dialog closed, and the PATCH was never fired — only the initial GET(s).
    await waitFor(() =>
      expect(screen.queryByText(/Cambiar estatus a Validada/)).not.toBeInTheDocument()
    );
    const patchCalls = fetchMock.mock.calls.filter(
      ([, init]) => (init as RequestInit | undefined)?.method === "PATCH"
    );
    expect(patchCalls).toHaveLength(0);
  });

  it("surfaces a 409 transition error in the dialog and keeps it open", async () => {
    const user = userEvent.setup();
    fetchMock.mockImplementation((input: string, init?: RequestInit) => {
      if (init?.method === "PATCH") {
        return Promise.resolve(
          mockJsonResponse({ error: "Transición no permitida" }, { status: 409 })
        );
      }
      if (input.startsWith("/api/cotizaciones?")) {
        return Promise.resolve(mockJsonResponse(initialList));
      }
      return Promise.resolve(mockJsonResponse({}));
    });

    render(<CotizacionesPage />);
    await waitFor(() => expect(screen.getByTestId("row-42-estatus")).toBeInTheDocument());

    await user.click(screen.getByTestId("row-42-pick-validada"));
    await user.click(screen.getByRole("button", { name: "Confirmar" }));

    // Server-provided error message should be surfaced and the dialog stays open
    // so the admin can either retry or cancel.
    await waitFor(() => expect(screen.getByText("Transición no permitida")).toBeInTheDocument());
    expect(screen.getByText(/Cambiar estatus a Validada/)).toBeInTheDocument();
  });
});
