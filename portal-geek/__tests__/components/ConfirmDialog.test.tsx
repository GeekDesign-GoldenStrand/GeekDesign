/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ConfirmDialog } from "@/components/ui/atoms/ConfirmDialog";

// The dialog renders inside a Modal that uses createPortal. jsdom supports the
// portal, but the destructive/confirm variants are identified by the class
// strings applied to the confirm button.
function getConfirmButton(label: string) {
  return screen.getByRole("button", { name: label });
}

describe("ConfirmDialog", () => {
  const baseProps = {
    isOpen: true,
    title: "Confirm action",
    description: "Are you sure?",
    onConfirm: jest.fn(),
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("variant=danger (default)", () => {
    it("renders the danger token classes on the confirm button", () => {
      render(<ConfirmDialog {...baseProps} confirmLabel="Delete" />);
      const btn = getConfirmButton("Delete");
      expect(btn.className).toContain("bg-danger");
      expect(btn.className).toContain("focus-visible:ring-danger");
    });

    it("defaults the confirm label to 'Eliminar' and loading label to 'Eliminando...'", () => {
      const { rerender } = render(<ConfirmDialog {...baseProps} />);
      expect(screen.getByRole("button", { name: "Eliminar" })).toBeInTheDocument();
      rerender(<ConfirmDialog {...baseProps} loading />);
      expect(screen.getByRole("button", { name: "Eliminando..." })).toBeInTheDocument();
    });

    it("does NOT pick up section-dependent brand/wine classes", () => {
      render(<ConfirmDialog {...baseProps} section="storefront" confirmLabel="Delete" />);
      const btn = getConfirmButton("Delete");
      expect(btn.className).not.toContain("bg-wine");
      expect(btn.className).not.toContain("bg-brand");
    });
  });

  describe("variant=primary, section=admin", () => {
    it("renders the brand token classes on the confirm button", () => {
      render(
        <ConfirmDialog {...baseProps} variant="primary" section="admin" confirmLabel="Continue" />
      );
      const btn = getConfirmButton("Continue");
      expect(btn.className).toContain("bg-brand");
      expect(btn.className).toContain("hover:bg-brand-hover");
      expect(btn.className).toContain("focus-visible:ring-brand");
      expect(btn.className).not.toContain("bg-wine");
      expect(btn.className).not.toContain("bg-danger");
    });

    it("defaults the label to 'Confirmar' / 'Procesando...'", () => {
      const { rerender } = render(
        <ConfirmDialog {...baseProps} variant="primary" section="admin" />
      );
      expect(screen.getByRole("button", { name: "Confirmar" })).toBeInTheDocument();
      rerender(<ConfirmDialog {...baseProps} variant="primary" section="admin" loading />);
      expect(screen.getByRole("button", { name: "Procesando..." })).toBeInTheDocument();
    });
  });

  describe("variant=primary, section=storefront", () => {
    it("renders the wine token classes on the confirm button", () => {
      render(
        <ConfirmDialog
          {...baseProps}
          variant="primary"
          section="storefront"
          confirmLabel="Aprobar"
        />
      );
      const btn = getConfirmButton("Aprobar");
      expect(btn.className).toContain("bg-wine");
      expect(btn.className).toContain("hover:bg-wine-hover");
      expect(btn.className).toContain("focus-visible:ring-wine");
      expect(btn.className).not.toContain("bg-brand");
      expect(btn.className).not.toContain("bg-danger");
    });

    it("danger and primary-storefront produce distinct confirm button colors", () => {
      const { rerender } = render(
        <ConfirmDialog
          {...baseProps}
          variant="primary"
          section="storefront"
          confirmLabel="Confirm"
        />
      );
      const primaryClasses = getConfirmButton("Confirm").className;
      rerender(<ConfirmDialog {...baseProps} variant="danger" confirmLabel="Confirm" />);
      const dangerClasses = getConfirmButton("Confirm").className;
      expect(primaryClasses).not.toEqual(dangerClasses);
      expect(primaryClasses).toContain("bg-wine");
      expect(dangerClasses).toContain("bg-danger");
    });
  });

  describe("interactions", () => {
    it("fires onConfirm when the confirm button is clicked", async () => {
      const onConfirm = jest.fn();
      render(<ConfirmDialog {...baseProps} onConfirm={onConfirm} confirmLabel="OK" />);
      await userEvent.click(getConfirmButton("OK"));
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it("fires onClose when the cancel button is clicked", async () => {
      const onClose = jest.fn();
      render(<ConfirmDialog {...baseProps} onClose={onClose} />);
      await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("disables both buttons while loading", () => {
      render(<ConfirmDialog {...baseProps} loading confirmLabel="OK" />);
      expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
      // While loading the confirm label is replaced by the loading label.
      expect(screen.getByRole("button", { name: "Eliminando..." })).toBeDisabled();
    });

    it("surfaces an inline error message via role='alert'", () => {
      render(<ConfirmDialog {...baseProps} error="Network down" />);
      const alert = screen.getByRole("alert");
      expect(alert).toHaveTextContent("Network down");
    });
  });

  describe("dontShowAgain", () => {
    it("renders the checkbox only when dontShowAgainKey is provided", () => {
      const { rerender } = render(<ConfirmDialog {...baseProps} />);
      expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
      rerender(<ConfirmDialog {...baseProps} dontShowAgainKey="confirm-cancel" />);
      expect(screen.getByRole("checkbox")).toBeInTheDocument();
    });

    it("persists the preference to localStorage when checked + confirmed", async () => {
      const onConfirm = jest.fn();
      render(
        <ConfirmDialog
          {...baseProps}
          onConfirm={onConfirm}
          dontShowAgainKey="confirm-cancel"
          confirmLabel="OK"
        />
      );
      await userEvent.click(screen.getByRole("checkbox"));
      await userEvent.click(getConfirmButton("OK"));
      expect(localStorage.getItem("confirm-cancel")).toBe("true");
      expect(onConfirm).toHaveBeenCalledTimes(1);
      localStorage.removeItem("confirm-cancel");
    });
  });

  it("renders nothing when isOpen is false", () => {
    render(<ConfirmDialog {...baseProps} isOpen={false} confirmLabel="OK" />);
    expect(screen.queryByRole("button", { name: "OK" })).not.toBeInTheDocument();
  });
});
