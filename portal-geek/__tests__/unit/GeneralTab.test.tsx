/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import React from "react";
import "@testing-library/jest-dom";

import { GeneralTab } from "@/components/admin/dashboard/templates/GeneralTab";

// Mock recharts because ResponsiveContainer relies on ResizeObserver
jest.mock("recharts", () => {
  const OriginalModule = jest.requireActual("recharts");
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="mock-responsive-container">{children}</div>
    ),
  };
});

describe("GeneralTab Configurar Vista", () => {
  const mockData = {
    2026: [{ mes: "Ene", mes_num: 1, name: "Ene", ingresos: 1000 }],
  };

  beforeEach(() => {
    // Clear localStorage and mock alert before each test
    window.localStorage.clear();
    jest.spyOn(window, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders with default configuration", () => {
    render(<GeneralTab data={mockData} isEditing={false} />);

    // By default, it should have "ingresos_anuales", "ingresos_mensuales"
    // "comparativa_historica", "desglose_mensual"
    expect(screen.getByText(/Ingresos Totales \(Anual\)/i)).toBeInTheDocument(); // Inside IngresosAnualesCard
    expect(screen.getByText(/Ingresos Totales \(Mensual\)/i)).toBeInTheDocument(); // Inside IngresosMensualesCard
    expect(screen.getAllByText(/Desglose Mensual/i).length).toBeGreaterThan(0); // Chart title
  });

  it("loads configuration from localStorage", () => {
    // Only 1 card and 0 charts saved
    window.localStorage.setItem(
      "dashboard_general_config",
      JSON.stringify({ cards: ["ingresos_anuales"], charts: [] })
    );

    render(<GeneralTab data={mockData} isEditing={false} />);

    expect(screen.getByText(/Ingresos Totales \(Anual\)/i)).toBeInTheDocument();

    // Ingresos mensuales card and charts should NOT be there
    expect(screen.queryByText(/Ingresos Totales \(Mensual\)/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Desglose Mensual/i)).not.toBeInTheDocument();
  });

  it("toggles widgets when editing and saves to localStorage", () => {
    render(<GeneralTab data={mockData} isEditing={true} />);

    // Uncheck "Ingresos Anuales"
    const checkboxAnual = screen.getByRole("checkbox", {
      name: /Ingresos Anuales/i,
    }) as HTMLInputElement;
    expect(checkboxAnual).toBeChecked();

    fireEvent.click(checkboxAnual);
    expect(checkboxAnual).not.toBeChecked();

    // Check that localStorage was updated
    const saved = JSON.parse(window.localStorage.getItem("dashboard_general_config") || "{}");
    expect(saved.cards).not.toContain("ingresos_anuales");
  });

  it("enforces limits on charts (max 5) and cards (max 3)", () => {
    // Set localStorage to 3 cards already
    window.localStorage.setItem(
      "dashboard_general_config",
      JSON.stringify({
        cards: ["ingresos_anuales", "ingresos_mensuales", "dummy_card"],
        charts: [],
      })
    );

    render(<GeneralTab data={mockData} isEditing={true} />);

    // Try to toggle another card? Actually we only have 2 cards available in the UI check,
    // but let's say the user clicks a checkbox for a card that IS NOT in the list.
    // In our UI, there are only 2 cards available to click. So the user can never exceed 3.
    // Let's test charts instead. There are 3 charts available.
    // If we mock localStorage with 5 charts:
    window.localStorage.setItem(
      "dashboard_general_config",
      JSON.stringify({
        cards: [],
        charts: ["chart1", "chart2", "chart3", "chart4", "chart5"],
      })
    );

    // Clear previous render
    cleanup();

    // Re-render to pick up new localStorage
    render(<GeneralTab data={mockData} isEditing={true} />);

    const checkboxHist = screen.getByRole("checkbox", {
      name: /Comparativa Histórica/i,
    }) as HTMLInputElement;
    // It's not checked because "comparativa_historica" is not in the array
    expect(checkboxHist).not.toBeChecked();

    fireEvent.click(checkboxHist);

    // Toast should be rendered because it exceeded 5
    expect(screen.getByText(/límite es de 5 gráficas/i)).toBeInTheDocument();
    // Still shouldn't be added
    const saved = JSON.parse(window.localStorage.getItem("dashboard_general_config") || "{}");
    expect(saved.charts).not.toContain("comparativa_historica");
  });

  it("renders empty state message when no widgets are selected", () => {
    window.localStorage.setItem(
      "dashboard_general_config",
      JSON.stringify({ cards: [], charts: [] })
    );

    render(<GeneralTab data={mockData} isEditing={false} />);

    expect(
      screen.getByText(/No has seleccionado ninguna métrica para mostrar/i)
    ).toBeInTheDocument();
  });
});
