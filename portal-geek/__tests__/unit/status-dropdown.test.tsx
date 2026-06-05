/**
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement, ReactNode } from "react";

import { StatusDropdown } from "@/components/ui/cotizaciones/atoms/StatusDropdown";
import { QUOTATION_STATUS } from "@/types/cotizacion";

// Mock the Popover primitive with a minimal click-to-open shell so we can
// assert the public contract — trigger renders, items list expected options,
// onSelect fires onChange — without depending on portal / positioning logic.
jest.mock("@/components/ui/primitives/Popover", () => {
  const { useState } = jest.requireActual("react");
  return {
    Popover: ({ trigger, children }: { trigger: ReactElement; children: ReactNode }) => {
      const [open, setOpen] = useState(false);
      // Wrap the trigger so it toggles `open` while preserving its existing
      // props (className, aria-label, etc.) for the test assertions.
      const wrappedTrigger = (
        <span onClick={() => setOpen((o: boolean) => !o)} data-testid="popover-trigger-wrap">
          {trigger}
        </span>
      );
      return (
        <div>
          {wrappedTrigger}
          {open && <div role="listbox">{children}</div>}
        </div>
      );
    },
    // Mirror the real PopoverItem contract: aria-selected reflects `selected`,
    // and clicking the selected row is a no-op (the real primitive skips
    // onSelect on the selected row and just closes the popover).
    PopoverItem: ({
      onSelect,
      selected = false,
      children,
    }: {
      onSelect: () => void;
      selected?: boolean;
      children: ReactNode;
    }) => (
      <button
        type="button"
        role="option"
        aria-selected={selected}
        onClick={() => {
          if (!selected) onSelect();
        }}
      >
        {children}
      </button>
    ),
    usePopoverClose: () => () => {},
  };
});

describe("StatusDropdown", () => {
  it("renders the current status as the colored trigger", () => {
    render(
      <StatusDropdown
        current={QUOTATION_STATUS.PENDIENTE}
        options={[QUOTATION_STATUS.VALIDADA, QUOTATION_STATUS.RECHAZADA]}
        onChange={jest.fn()}
      />
    );
    const trigger = screen.getByRole("button", { name: "Cambiar estatus de la cotización" });
    expect(trigger).toHaveTextContent("Pendiente");
    // The Pendiente status colors come from STATUS_COLORS — assert the bg
    // class is applied so a future refactor that drops the colored trigger
    // breaks this test.
    expect(trigger.className).toMatch(/bg-\[#F7B9FF\]/);
    expect(trigger.className).toMatch(/text-\[#D83CFF\]/);
  });

  it("opens the menu and shows current as selected + Validada + Rechazada (no Cancelada/Aprobada)", async () => {
    const user = userEvent.setup();
    render(
      <StatusDropdown
        current={QUOTATION_STATUS.PENDIENTE}
        options={[QUOTATION_STATUS.VALIDADA, QUOTATION_STATUS.RECHAZADA]}
        onChange={jest.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: "Cambiar estatus de la cotización" }));

    // Current status renders first as the selected row so users see at a
    // glance which value is active — matches the cotizaciones-table dropdown.
    const opts = screen.getAllByRole("option").map((o) => o.textContent);
    expect(opts).toEqual(["Pendiente", "Validada", "Rechazada"]);
    expect(screen.getByRole("option", { name: "Pendiente" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(screen.getByRole("option", { name: "Validada" })).toHaveAttribute(
      "aria-selected",
      "false"
    );
    expect(screen.queryByRole("option", { name: "Cancelada" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Aprobada" })).not.toBeInTheDocument();
  });

  it("does not render the current status twice if the parent includes it in options", async () => {
    // Defensive de-dupe: the parent normally omits `current` from `options`,
    // but if a future caller forgets, the dropdown must not show two
    // "Pendiente" rows (one selected, one actionable).
    const user = userEvent.setup();
    render(
      <StatusDropdown
        current={QUOTATION_STATUS.PENDIENTE}
        options={[QUOTATION_STATUS.PENDIENTE, QUOTATION_STATUS.VALIDADA]}
        onChange={jest.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: "Cambiar estatus de la cotización" }));

    const pendienteRows = screen.getAllByRole("option", { name: "Pendiente" });
    expect(pendienteRows).toHaveLength(1);
    expect(pendienteRows[0]).toHaveAttribute("aria-selected", "true");
  });

  it("fires onChange with the picked status", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(
      <StatusDropdown
        current={QUOTATION_STATUS.PENDIENTE}
        options={[QUOTATION_STATUS.VALIDADA, QUOTATION_STATUS.RECHAZADA]}
        onChange={onChange}
      />
    );

    await user.click(screen.getByRole("button", { name: "Cambiar estatus de la cotización" }));
    await user.click(screen.getByRole("option", { name: "Validada" }));

    expect(onChange).toHaveBeenCalledWith(QUOTATION_STATUS.VALIDADA);
  });

  it("does not fire onChange when the current (selected) row is clicked", async () => {
    // Clicking the row that's already selected should be a no-op — the
    // Popover primitive swallows the call and just closes the panel. This
    // prevents accidental "PATCH from Pendiente to Pendiente" requests.
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(
      <StatusDropdown
        current={QUOTATION_STATUS.PENDIENTE}
        options={[QUOTATION_STATUS.VALIDADA, QUOTATION_STATUS.RECHAZADA]}
        onChange={onChange}
      />
    );

    await user.click(screen.getByRole("button", { name: "Cambiar estatus de la cotización" }));
    await user.click(screen.getByRole("option", { name: "Pendiente" }));

    expect(onChange).not.toHaveBeenCalled();
  });

  it("renders a non-interactive colored badge when there are no options", () => {
    render(
      <StatusDropdown current={QUOTATION_STATUS.APROBADA} options={[]} onChange={jest.fn()} />
    );
    // No trigger button at all — the inert pill should be rendered instead.
    expect(
      screen.queryByRole("button", { name: "Cambiar estatus de la cotización" })
    ).not.toBeInTheDocument();
    expect(screen.getByText("Aprobada")).toBeInTheDocument();
  });

  it("renders a non-interactive colored badge when explicitly disabled", () => {
    render(
      <StatusDropdown
        current={QUOTATION_STATUS.PENDIENTE}
        options={[QUOTATION_STATUS.VALIDADA]}
        onChange={jest.fn()}
        disabled
      />
    );
    expect(
      screen.queryByRole("button", { name: "Cambiar estatus de la cotización" })
    ).not.toBeInTheDocument();
    expect(screen.getByText("Pendiente")).toBeInTheDocument();
  });
});
