/**
 * @jest-environment jsdom
 */

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps, ReactNode } from "react";

import EditarVariablesDetalle from "@/app/(admin)/cotizaciones/[id]/editar-variables-detalle";
import type { LineItem } from "@/types/cotizacion";

jest.mock("@/components/ui/terceros/molecules/ModalShell", () => ({
  ModalShell: ({ title, children }: { title: string; children: ReactNode }) => (
    <section aria-label={title}>{children}</section>
  ),
}));

jest.mock("@/components/ui/atoms/Button", () => ({
  Button: ({
    children,
    type,
    onClick,
    disabled,
  }: {
    children: ReactNode;
    type?: "button" | "submit" | "reset";
    onClick?: () => void;
    disabled?: boolean;
  }) => (
    <button type={type} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

const mockFetch = jest.fn();

const servicio: LineItem = {
  id_detalle: 5,
  id_servicio: 7,
  id_material: 3,
  nombre_servicio: "Corte Láser",
  nombre_material: "MDF 3mm",
  cantidad: 4,
  precio_unitario: 50,
  subtotal: 200,
  formula_expresion: "ancho * alto * costo_laser",
  variables: [
    {
      id_variable: 100,
      nombre_variable: "ancho",
      etiqueta: "Ancho",
      unidad: "cm",
      editable_por_cliente: true,
      valor: 12,
    },
    {
      id_variable: 101,
      nombre_variable: "alto",
      etiqueta: "Alto",
      unidad: "cm",
      editable_por_cliente: false,
      valor: 25,
    },
  ],
};

function setup(overrides?: Partial<ComponentProps<typeof EditarVariablesDetalle>>) {
  const onSaved = jest.fn();
  const onClose = jest.fn();
  render(
    <EditarVariablesDetalle
      idCotizacion={123}
      isOpen
      servicio={servicio}
      onSaved={onSaved}
      onClose={onClose}
      {...overrides}
    />
  );
  return { onSaved, onClose };
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  // Default success response for both /calcular-precio (data.precioUnitario)
  // and PATCH (data.detalle, data.monto_total). Tests override per call as needed.
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({ data: { precioUnitario: 50 } }),
  });
  global.fetch = mockFetch as unknown as typeof fetch;
});

afterEach(() => {
  // Run any pending debounce timers + restore real timers so the next test
  // starts clean and React's act flush doesn't trip on lingering callbacks.
  act(() => {
    jest.runOnlyPendingTimers();
  });
  jest.useRealTimers();
});

describe("EditarVariablesDetalle modal", () => {
  it("renders nothing when closed", () => {
    setup({ isOpen: false });
    expect(screen.queryByLabelText(/Editar variables/i)).not.toBeInTheDocument();
  });

  it("renders nothing when no servicio is supplied", () => {
    setup({ servicio: null });
    expect(screen.queryByLabelText(/Editar variables/i)).not.toBeInTheDocument();
  });

  it("renders the formula expression and one input per variable", () => {
    setup();

    expect(screen.getByText("ancho * alto * costo_laser")).toBeInTheDocument();
    expect(screen.getByText(/Ancho/)).toBeInTheDocument();
    expect(screen.getByText(/Alto/)).toBeInTheDocument();

    // The inputs are number boxes — find by their initial values.
    expect(screen.getByDisplayValue("12")).toBeInTheDocument();
    expect(screen.getByDisplayValue("25")).toBeInTheDocument();
  });

  it("debounces and POSTs to /calcular-precio with the edited variable values", async () => {
    setup();

    const anchoInput = screen.getByDisplayValue("12");
    fireEvent.change(anchoInput, { target: { value: "30" } });

    // Before the debounce elapses, no fetch should have fired.
    expect(mockFetch).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(400);
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("/api/servicios/7/calcular-precio");
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      id_material: 3,
      variables: [
        { nombre_variable: "ancho", valor: 30 },
        { nombre_variable: "alto", valor: 25 },
      ],
    });
  });

  it("updates the displayed precio_unitario after the preview returns", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { precioUnitario: 87.5 } }),
    });

    setup();
    fireEvent.change(screen.getByDisplayValue("12"), { target: { value: "40" } });

    await act(async () => {
      jest.advanceTimersByTime(400);
    });
    await waitFor(() => {
      expect(screen.getByText("$87.50")).toBeInTheDocument();
    });
    // Subtotal = 87.5 × cantidad(4) = 350
    expect(screen.getByText("$350.00")).toBeInTheDocument();
  });

  it("does not fire /calcular-precio when a value is invalid (e.g. empty)", async () => {
    setup();

    fireEvent.change(screen.getByDisplayValue("12"), { target: { value: "" } });

    await act(async () => {
      jest.advanceTimersByTime(400);
    });

    expect(mockFetch).not.toHaveBeenCalled();
    expect(screen.getByText(/mayores que 0/i)).toBeInTheDocument();
  });

  it("PATCHes the variables endpoint and reports back via onSaved on confirm", async () => {
    // Drain the initial debounce so the first fetch corresponds to the PATCH.
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          detalle: { precio_unitario: "60.00", subtotal: "240.00" },
          monto_total: 240,
        },
      }),
    });

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const { onSaved, onClose } = setup();

    fireEvent.change(screen.getByDisplayValue("12"), { target: { value: "30" } });

    // Skip the debounced preview fetch.
    await act(async () => {
      jest.advanceTimersByTime(400);
    });
    mockFetch.mockClear();

    await user.click(screen.getByRole("button", { name: "Confirmar" }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/cotizaciones/123/detalles/5/variables",
        expect.objectContaining({
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
        })
      );
    });

    const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string);
    expect(body).toEqual({
      variables: [
        { id_variable: 100, valor: 30 },
        { id_variable: 101, valor: 25 },
      ],
    });

    expect(onSaved).toHaveBeenCalledWith({
      id_detalle: 5,
      precio_unitario: 60,
      subtotal: 240,
      variables: expect.arrayContaining([
        expect.objectContaining({ id_variable: 100, valor: 30 }),
        expect.objectContaining({ id_variable: 101, valor: 25 }),
      ]),
    });
    expect(onClose).toHaveBeenCalled();
  });

  it("shows the server error message when PATCH returns 409", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const { onSaved, onClose } = setup();

    fireEvent.change(screen.getByDisplayValue("12"), { target: { value: "30" } });
    await act(async () => {
      jest.advanceTimersByTime(400);
    });

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({ error: "Cotización ya no es Pendiente" }),
    });

    await user.click(screen.getByRole("button", { name: "Confirmar" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Cotización ya no es Pendiente");
    expect(onSaved).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("blocks confirm when a variable value is invalid and shows an inline error", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const { onSaved } = setup();

    fireEvent.change(screen.getByDisplayValue("12"), { target: { value: "" } });

    await user.click(screen.getByRole("button", { name: "Confirmar" }));

    // No PATCH should have fired — only the early validation alert renders.
    const patchCall = mockFetch.mock.calls.find(([url]) =>
      String(url).includes("/detalles/5/variables")
    );
    expect(patchCall).toBeUndefined();
    expect(await screen.findByRole("alert")).toHaveTextContent(/Ancho/);
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("closes without firing PATCH when Cancel is pressed", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const { onSaved, onClose } = setup();

    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onClose).toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
    const patchCall = mockFetch.mock.calls.find(([url]) =>
      String(url).includes("/detalles/5/variables")
    );
    expect(patchCall).toBeUndefined();
  });

  it("closes without PATCHing when Confirm is pressed but nothing was edited", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const { onSaved, onClose } = setup();

    await user.click(screen.getByRole("button", { name: "Confirmar" }));

    expect(onClose).toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
    const patchCall = mockFetch.mock.calls.find(([url]) =>
      String(url).includes("/detalles/5/variables")
    );
    expect(patchCall).toBeUndefined();
  });
});
