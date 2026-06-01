/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Button } from "@/components/ui/atoms/Button";

describe("Button", () => {
  describe("variants", () => {
    it("primary admin uses brand tokens", () => {
      render(<Button>Go</Button>);
      const btn = screen.getByRole("button", { name: "Go" });
      expect(btn.className).toContain("bg-brand");
      expect(btn.className).toContain("text-brand-on");
    });

    it("primary storefront uses wine tokens", () => {
      render(<Button section="storefront">Comprar</Button>);
      const btn = screen.getByRole("button", { name: "Comprar" });
      expect(btn.className).toContain("bg-wine");
      expect(btn.className).toContain("text-wine-on");
      expect(btn.className).not.toContain("bg-brand");
    });

    it("secondary uses neutral surface + line classes", () => {
      render(<Button variant="secondary">Cancel</Button>);
      const btn = screen.getByRole("button", { name: "Cancel" });
      expect(btn.className).toContain("bg-white");
      expect(btn.className).toContain("text-ink-muted");
      expect(btn.className).toContain("border-line");
    });

    it("destructive uses danger token", () => {
      render(<Button variant="destructive">Delete</Button>);
      expect(screen.getByRole("button", { name: "Delete" }).className).toContain("bg-danger");
    });

    it("ghost is transparent with ink text", () => {
      render(<Button variant="ghost">Skip</Button>);
      const btn = screen.getByRole("button", { name: "Skip" });
      expect(btn.className).toContain("bg-transparent");
      expect(btn.className).toContain("text-ink");
    });

    it("outline-dashed default tone uses neutral ink border", () => {
      render(<Button variant="outline-dashed">Assign</Button>);
      const btn = screen.getByRole("button", { name: "Assign" });
      expect(btn.className).toContain("border-dashed");
      expect(btn.className).toContain("border-ink");
      expect(btn.className).toContain("text-ink");
    });

    it("outline-dashed danger tone swaps to brand border + text", () => {
      render(
        <Button variant="outline-dashed" tone="danger">
          Remove
        </Button>
      );
      const btn = screen.getByRole("button", { name: "Remove" });
      expect(btn.className).toContain("border-brand");
      expect(btn.className).toContain("text-brand");
      expect(btn.className).not.toContain("border-ink");
    });
  });

  describe("sizes", () => {
    const cases = [
      ["sm", "h-10"],
      ["md", "h-12"],
      ["lg", "h-[61px]"],
      ["xl", "h-[63px]"],
    ] as const;

    it.each(cases)("%s renders the %s height class", (size, expected) => {
      render(<Button size={size}>Label</Button>);
      expect(screen.getByRole("button", { name: "Label" }).className).toContain(expected);
    });

    it("xl size is the full-width auth pill (replaces legacy PrimaryButton)", () => {
      render(<Button size="xl">Iniciar Sesión</Button>);
      const btn = screen.getByRole("button", { name: "Iniciar Sesión" });
      expect(btn.className).toContain("w-full");
      expect(btn.className).toContain("rounded-full");
    });
  });

  describe("section affects only the primary variant", () => {
    it("section is ignored when variant is secondary", () => {
      render(
        <Button variant="secondary" section="storefront">
          Cancel
        </Button>
      );
      const btn = screen.getByRole("button", { name: "Cancel" });
      expect(btn.className).not.toContain("bg-wine");
      expect(btn.className).not.toContain("bg-brand");
    });

    it("section is ignored when variant is destructive", () => {
      render(
        <Button variant="destructive" section="storefront">
          Delete
        </Button>
      );
      const btn = screen.getByRole("button", { name: "Delete" });
      expect(btn.className).toContain("bg-danger");
      expect(btn.className).not.toContain("bg-wine");
    });
  });

  describe("loading state", () => {
    it("renders the spinner alongside children when loading", () => {
      render(<Button loading>Saving…</Button>);
      const btn = screen.getByRole("button", { name: "Saving…" });
      expect(btn.querySelector("svg")).toBeInTheDocument();
      expect(btn.className).toContain("cursor-wait");
    });

    it("is disabled while loading even if disabled prop is omitted", () => {
      render(<Button loading>Saving…</Button>);
      expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
    });

    it("does not fire onClick while loading", async () => {
      const onClick = jest.fn();
      render(
        <Button loading onClick={onClick}>
          Saving…
        </Button>
      );
      await userEvent.click(screen.getByRole("button", { name: "Saving…" }));
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe("disabled state", () => {
    it("respects the disabled prop and blocks onClick", async () => {
      const onClick = jest.fn();
      render(
        <Button disabled onClick={onClick}>
          Continue
        </Button>
      );
      const btn = screen.getByRole("button", { name: "Continue" });
      expect(btn).toBeDisabled();
      await userEvent.click(btn);
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe("defaults & overrides", () => {
    it("defaults type to 'button' so it doesn't submit parent forms by accident", () => {
      render(<Button>Default</Button>);
      expect(screen.getByRole("button", { name: "Default" })).toHaveAttribute("type", "button");
    });

    it("allows explicit type='submit'", () => {
      render(<Button type="submit">Send</Button>);
      expect(screen.getByRole("button", { name: "Send" })).toHaveAttribute("type", "submit");
    });

    it("merges a custom className onto the computed classes", () => {
      render(<Button className="custom-extra">Hi</Button>);
      const btn = screen.getByRole("button", { name: "Hi" });
      expect(btn.className).toContain("custom-extra");
      expect(btn.className).toContain("bg-brand");
    });
  });

  describe("asChild", () => {
    it("renders the child element instead of a <button>", () => {
      render(
        <Button asChild>
          <a href="/somewhere">Link</a>
        </Button>
      );
      const link = screen.getByRole("link", { name: "Link" });
      expect(link.tagName).toBe("A");
      expect(link).toHaveAttribute("href", "/somewhere");
      expect(link.className).toContain("bg-brand");
    });

    it("merges its computed classes with the child's existing className", () => {
      render(
        <Button asChild className="extra">
          <a href="/x" className="child-class">
            Link
          </a>
        </Button>
      );
      const link = screen.getByRole("link", { name: "Link" });
      expect(link.className).toContain("child-class");
      expect(link.className).toContain("extra");
      expect(link.className).toContain("bg-brand");
    });
  });
});
