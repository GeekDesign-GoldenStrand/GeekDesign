/**
 * @jest-environment jsdom
 */

import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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
      canManageDiscount
      onSave={onSave}
      onClose={onClose}
      {...overrides}
    />
  );

  return { onSave, onClose };
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
  it("renders existing discount fields for users who can manage discounts", async () => {
    await setupReady();

    expect(screen.getByText("Descuento")).toBeInTheDocument();
    expect(screen.getByLabelText("Porcentaje")).toHaveValue("10");
    expect(screen.getByLabelText("Motivo")).toHaveValue("Cliente frecuente");
  });

  it("does not render discount fields when the user cannot manage discounts", async () => {
    await setupReady({
      canManageDiscount: false,
    });

    expect(screen.queryByText("Descuento")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Porcentaje")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Motivo")).not.toBeInTheDocument();
  });

  it("only exposes valid discount percentage options", async () => {
    await setupReady();

    const percentageSelect = screen.getByLabelText("Porcentaje");
    const options = within(percentageSelect).getAllByRole("option");

    expect(options.map((option) => option.getAttribute("value"))).toEqual(["5", "10", "15", "20"]);
  });

  it("sends only the discount PATCH request when only the discount changes", async () => {
    const user = userEvent.setup();
    const { onSave, onClose } = await setupReady();

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
  });

  it("sanitizes the discount reason before submitting", async () => {
    const user = userEvent.setup();
    await setupReady();

    fireEvent.change(screen.getByLabelText("Motivo"), {
      target: { value: "Cliente frecuente especial ⋆𐙚₊˚⊹♡ 😊" },
    });

    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/cotizaciones/123/descuento",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({
            porcentaje_descuento: 10,
            motivo_descuento: "Cliente frecuente especial",
          }),
        })
      );
    });
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
        "/api/cotizaciones/123/descuento",
        expect.objectContaining({
          method: "PATCH",
        })
      );

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/cotizaciones/123",
        expect.objectContaining({
          method: "PUT",
        })
      );
    });
  });

  it("does not send quotation PUT when discount PATCH fails", async () => {
    const user = userEvent.setup();
    await setupReady();

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({ error: "Sin permisos para modificar descuentos" }),
    });

    await user.clear(screen.getByLabelText("Notas"));
    await user.type(screen.getByLabelText("Notas"), "Notas actualizadas");

    fireEvent.change(screen.getByLabelText("Porcentaje"), {
      target: { value: "15" },
    });

    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Sin permisos para modificar descuentos"
    );

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/cotizaciones/123/descuento",
      expect.objectContaining({
        method: "PATCH",
      })
    );

    expect(mockFetch).not.toHaveBeenCalledWith(
      "/api/cotizaciones/123",
      expect.objectContaining({ method: "PUT" })
    );
  });

  it("shows a partial-save message when discount saves but quotation update fails", async () => {
    const user = userEvent.setup();
    await setupReady();

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: {} }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({ error: "No se puede modificar esta cotización" }),
      });

    await user.clear(screen.getByLabelText("Notas"));
    await user.type(screen.getByLabelText("Notas"), "Notas actualizadas");

    fireEvent.change(screen.getByLabelText("Porcentaje"), {
      target: { value: "15" },
    });

    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "El descuento se guardó, pero no se pudieron guardar los cambios generales"
    );
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
});
