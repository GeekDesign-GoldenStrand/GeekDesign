/**
 * @jest-environment jsdom
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps, ReactNode } from "react";

import EditarCotizacion from "@/app/(admin)/cotizaciones/[id]/editar-cotizacion";
import type { EditableFields } from "@/app/(admin)/cotizaciones/[id]/editar-cotizacion";

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

jest.mock("@/components/ui/atoms/Select", () => ({
  Select: ({
    children,
    value,
    onChange,
  }: {
    children: ReactNode;
    value: string;
    onChange: (value: string) => void;
  }) => (
    <select value={value} onChange={(event) => onChange(event.target.value)}>
      {children}
    </select>
  ),
  SelectOption: ({ children, value }: { children: ReactNode; value: string }) => (
    <option value={value}>{children}</option>
  ),
}));

const mockFetch = jest.fn();

const initialFields: EditableFields = {
  id_cliente: 1,
  nombre_oportunidad: "Letrero exterior",
  fecha_fin: "",
  notas: "Notas iniciales",
  servicios: [
    {
      id_detalle: 10,
      nombre_servicio: "Impresión",
      nombre_material: "Vinil",
      cantidad: 2,
      precio_unitario: 500,
      subtotal: 1000,
      notas: undefined,
      variables: [],
    },
  ],
};

function setup(overrides?: Partial<ComponentProps<typeof EditarCotizacion>>) {
  const onSave = jest.fn();
  const onClose = jest.fn();
  const onSuccess = jest.fn();

  render(
    <EditarCotizacion
      idCotizacion={123}
      isOpen
      initial={initialFields}
      currentCliente={{
        id_cliente: 1,
        nombre_cliente: "Cliente Demo",
        empresa: "Empresa Demo",
      }}
      porcentajeDescuento={10}
      motivoDescuento="Cliente frecuente"
      userRole="Direccion"
      onSave={onSave}
      onClose={onClose}
      onSuccess={onSuccess}
      {...overrides}
    />
  );

  return { onSave, onClose, onSuccess };
}

async function setupReady(overrides?: Partial<ComponentProps<typeof EditarCotizacion>>) {
  const handlers = setup(overrides);

  await waitFor(() => {
    expect(mockFetch).toHaveBeenCalledWith("/api/clientes?page=1&pageSize=100");
  });

  mockFetch.mockClear();

  return handlers;
}

beforeEach(() => {
  jest.clearAllMocks();

  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({ data: [] }),
  });

  global.fetch = mockFetch as unknown as typeof fetch;
  window.alert = jest.fn();
});

describe("EditarCotizacion discount editing", () => {
  it("renders existing discount fields when the quotation has a discount", async () => {
    await setupReady();

    expect(screen.getByText("Descuento")).toBeInTheDocument();
    expect(screen.getByLabelText("Porcentaje")).toHaveValue("10");
    expect(screen.getByLabelText("Motivo")).toHaveValue("Cliente frecuente");
  });

  it("sends only the discount PATCH request when only the discount changes", async () => {
    const user = userEvent.setup();
    const { onSave, onClose, onSuccess } = await setupReady();

    fireEvent.change(screen.getByLabelText("Porcentaje"), {
      target: { value: "15" },
    });

    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/cotizaciones/123/descuento",
        expect.objectContaining({
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            porcentaje_descuento: 15,
            motivo_descuento: "Cliente frecuente",
          }),
        })
      );
    });

    expect(mockFetch).not.toHaveBeenCalledWith(
      "/api/cotizaciones/123",
      expect.objectContaining({ method: "PUT" })
    );

    expect(onSave).toHaveBeenCalledWith(initialFields);
    expect(onClose).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalled();
  });

  it("sends both quotation PUT and discount PATCH when both sections change", async () => {
    const user = userEvent.setup();
    await setupReady();

    await user.clear(screen.getByLabelText("Notas"));
    await user.type(screen.getByLabelText("Notas"), "Notas actualizadas");

    fireEvent.change(screen.getByLabelText("Porcentaje"), {
      target: { value: "15" },
    });

    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/cotizaciones/123",
        expect.objectContaining({
          method: "PUT",
        })
      );

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/cotizaciones/123/descuento",
        expect.objectContaining({
          method: "PATCH",
        })
      );
    });
  });

  it("shows a validation error and does not submit when discount is empty", async () => {
    const user = userEvent.setup();
    await setupReady();

    fireEvent.change(screen.getByLabelText("Porcentaje"), {
      target: { value: "" },
    });

    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Ingresa un número entero");

    expect(mockFetch).not.toHaveBeenCalledWith(
      "/api/cotizaciones/123/descuento",
      expect.anything()
    );

    expect(mockFetch).not.toHaveBeenCalledWith(
      "/api/cotizaciones/123",
      expect.objectContaining({ method: "PUT" })
    );
  });

  it("preserves a two-digit value typed into the discount input without snapping to the minimum", async () => {
    await setupReady();

    const input = screen.getByLabelText("Porcentaje");

    fireEvent.change(input, { target: { value: "1" } });
    expect(input).toHaveValue("1");

    fireEvent.change(input, { target: { value: "10" } });
    expect(input).toHaveValue("10");
  });

  it("clamps the discount input to the upper bound when a higher value is typed", async () => {
    await setupReady();

    const input = screen.getByLabelText("Porcentaje");

    fireEvent.change(input, { target: { value: "50" } });
    expect(input).toHaveValue("20");
  });

  it("strips emojis and decorative characters from the discount reason", async () => {
    await setupReady();

    const input = screen.getByLabelText("Motivo");

    fireEvent.change(input, {
      target: { value: "Cliente VIP ⋆𐙚₊˚⊹♡ 🎉" },
    });

    expect(input).toHaveValue("Cliente VIP  ");
  });

  it("does not render discount fields when the quotation has no existing discount", async () => {
    await setupReady({
      porcentajeDescuento: null,
      motivoDescuento: null,
    });

    expect(screen.queryByText("Descuento")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Porcentaje")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Motivo")).not.toBeInTheDocument();
  });

  it("hides the discount editor for non-Direccion roles even when a discount exists", async () => {
    await setupReady({ userRole: "Colaborador" });

    expect(screen.queryByText("Descuento")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Porcentaje")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Motivo")).not.toBeInTheDocument();
  });

  it("hides the discount editor when no role is provided (defaults to non-Direccion)", async () => {
    await setupReady({ userRole: undefined });

    expect(screen.queryByText("Descuento")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Porcentaje")).not.toBeInTheDocument();
  });

  it("surfaces a partial-save error when the quotation PUT succeeds but the discount PATCH fails", async () => {
    const user = userEvent.setup();
    const { onSave, onClose } = await setupReady();

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { id_cotizacion: 123 } }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({ error: "Estatus no permite descuento" }),
      });

    await user.clear(screen.getByLabelText("Notas"));
    await user.type(screen.getByLabelText("Notas"), "Notas actualizadas");

    fireEvent.change(screen.getByLabelText("Porcentaje"), {
      target: { value: "15" },
    });

    await user.click(screen.getByRole("button", { name: "Guardar" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/cambios de la cotizaci.n s. se guardaron/i);
    expect(alert).toHaveTextContent("Estatus no permite descuento");

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ notas: "Notas actualizadas" }));
    expect(onClose).not.toHaveBeenCalled();
  });
});
