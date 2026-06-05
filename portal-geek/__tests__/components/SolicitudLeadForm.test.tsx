/**
 * @jest-environment jsdom
 *
 * ST-10/11/12 — SolicitudLeadForm. Field-config-driven; composes the filled
 * fields into descripcion_solicitud, submits to the lead endpoint, then shows an
 * inline confirmation with the folio.
 */
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { LeadField } from "@/components/storefront/organisms/SolicitudLeadForm";
import { SolicitudLeadForm } from "@/components/storefront/organisms/SolicitudLeadForm";

const FIELDS: LeadField[] = [
  {
    name: "objetivo",
    kind: "textarea",
    label: "¿Qué te gustaría lograr?",
    resumen: "Objetivo",
    required: true,
    maxLength: 1000,
  },
];

function renderForm() {
  return render(
    <SolicitudLeadForm
      tipo="idea_nula"
      titulo="No sé lo que quiero"
      intro="Cuéntanos qué necesitas."
      fields={FIELDS}
    />
  );
}

describe("SolicitudLeadForm", () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("ST11-C2: el campo numérico (cantidad) rechaza caracteres no numéricos", async () => {
    const user = userEvent.setup();
    render(
      <SolicitudLeadForm
        tipo="idea_vaga"
        titulo="Tengo una idea"
        intro="i"
        fields={[{ name: "cantidad", kind: "number", label: "Cantidad", required: true, min: 1 }]}
      />
    );
    const input = screen.getByLabelText(/Cantidad/);
    await user.type(input, "abc");
    expect(input).toHaveValue(""); // letters rejected outright
    await user.type(input, "12");
    expect(input).toHaveValue("12");
  });

  it("ST10-C7: presupuesto solo acepta números con máximo 2 decimales", async () => {
    const user = userEvent.setup();
    renderForm();
    const input = screen.getByLabelText(/Presupuesto aproximado/);
    await user.type(input, "abc12.999");
    expect(input).toHaveValue("12.99"); // non-numeric stripped, decimals capped at 2
  });

  it("ST10-C4: renderiza el título y los campos requeridos", () => {
    renderForm();
    expect(screen.getByRole("heading", { name: "No sé lo que quiero" })).toBeInTheDocument();
    expect(screen.getByLabelText(/Nombre completo/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Correo electrónico/)).toBeInTheDocument();
    expect(screen.getByLabelText(/¿Qué te gustaría lograr\?/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Presupuesto aproximado/)).toBeInTheDocument();
  });

  it("ST10-C5: un submit vacío muestra errores y no llama al endpoint", async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
    const { container } = renderForm();

    // Submit the form directly — jsdom enforces HTML5 `required` on a button
    // click, which would block before our onSubmit runs. fireEvent.submit
    // exercises the React-level validators (whitespace, format, etc.).
    fireEvent.submit(container.querySelector("form")!);

    expect(await screen.findByText("El nombre es requerido")).toBeInTheDocument();
    expect(screen.getByText("Este campo es requerido")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("ST10-C6: compone la descripción, envía la solicitud y muestra el folio", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { folio: "GD-2026-00001" }, error: null }),
    } as Response);
    global.fetch = fetchMock as unknown as typeof fetch;

    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/Nombre completo/), "Ana Cliente");
    await user.type(screen.getByLabelText(/Correo electrónico/), "ana@example.com");
    await user.type(screen.getByLabelText(/¿Qué te gustaría lograr\?/), "No se que quiero");
    // PhoneInput renders a tel input; default country is MX (+52).
    await user.type(screen.getByRole("textbox", { name: /Teléfono|Phone/i }), "5512345678");

    await user.click(screen.getByRole("button", { name: "Enviar solicitud" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/storefront/cotizaciones/lead");
    const payload = JSON.parse((init as RequestInit).body as string);
    expect(payload.tipo_solicitud).toBe("idea_nula");
    expect(payload.cliente.nombre_cliente).toBe("Ana Cliente");
    // Fields are composed into a single labeled descripcion_solicitud.
    expect(payload.descripcion_solicitud).toBe("Objetivo: No se que quiero");

    expect(await screen.findByText("¡Solicitud recibida!")).toBeInTheDocument();
    expect(screen.getByText("GD-2026-00001")).toBeInTheDocument();
  });
});
