"use client";

import {
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from "react";

// Headless popover primitive extracted from MaquinaStatusDropdown / StatusDropdown /
// CategoryDropdown — all three duplicated click-outside + position logic. Now
// they're thin wrappers around this.
//
// Usage:
//   <Popover trigger={<button>Status: Active</button>}>
//     <PopoverItem onSelect={() => ...}>Active</PopoverItem>
//     <PopoverItem onSelect={() => ...}>Inactive</PopoverItem>
//   </Popover>
//
// Inside the popover body, call usePopoverClose() to dismiss programmatically.

type Align = "start" | "center" | "end";

interface PopoverContextValue {
  close: () => void;
}

const PopoverContext = createContext<PopoverContextValue | null>(null);

export function usePopoverClose(): () => void {
  const ctx = useContext(PopoverContext);
  if (!ctx) {
    throw new Error("usePopoverClose must be used inside <Popover>");
  }
  return ctx.close;
}

type TriggerProps = {
  onClick?: (e: MouseEvent) => void;
  "aria-expanded"?: boolean;
  "aria-haspopup"?: "menu" | "listbox" | "tree" | "grid" | "dialog" | "true" | "false" | boolean;
};

interface PopoverProps {
  /** The clickable element that toggles the popover. Must be a single element. */
  trigger: ReactElement<TriggerProps>;
  /** Horizontal alignment of the popover relative to the trigger. */
  align?: Align;
  children: ReactNode;
  /** Optional className on the floating popover panel. */
  panelClassName?: string;
}

const ALIGN_CLASSES: Record<Align, string> = {
  start: "left-0",
  center: "left-1/2 -translate-x-1/2",
  end: "right-0",
};

// useLayoutEffect warns during SSR; fall back to useEffect on the server so the
// flip measurement (client-only, runs on open) stays warning-free.
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function Popover({ trigger, align = "start", panelClassName, children }: PopoverProps) {
  const [open, setOpen] = useState(false);
  // Panel opens downward by default; flips up when the trigger is too close to
  // the bottom of the viewport for the panel to fit below it.
  const [direction, setDirection] = useState<"down" | "up">("down");
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: globalThis.MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Measure available space once the panel is mounted and flip it above the
  // trigger if it would overflow the viewport bottom. Runs before paint so the
  // panel never visibly jumps from down to up.
  useIsomorphicLayoutEffect(() => {
    if (!open) {
      setDirection("down");
      return;
    }
    const container = containerRef.current;
    const panel = panelRef.current;
    if (!container || !panel) return;
    const { top, bottom } = container.getBoundingClientRect();
    const panelHeight = panel.offsetHeight;
    const spaceBelow = window.innerHeight - bottom;
    setDirection(spaceBelow < panelHeight + 12 && top > spaceBelow ? "up" : "down");
  }, [open]);

  if (!isValidElement(trigger)) {
    throw new Error("Popover trigger must be a single React element");
  }

  const triggerProps = trigger.props;
  // PopoverItem uses role="option" + aria-selected, so the panel + trigger
  // semantics are listbox (selectable list) — not menu (action list). Every
  // current caller is a selectable dropdown.
  const wrappedTrigger = cloneElement(trigger, {
    onClick: (e: MouseEvent) => {
      triggerProps.onClick?.(e);
      setOpen((o) => !o);
    },
    "aria-expanded": open,
    "aria-haspopup": "listbox",
  });

  const close = () => setOpen(false);

  return (
    <PopoverContext.Provider value={{ close }}>
      <div ref={containerRef} className="relative inline-block">
        {wrappedTrigger}
        {open && (
          <div
            ref={panelRef}
            role="listbox"
            className={`absolute z-50 ${
              direction === "up" ? "bottom-[calc(100%+6px)]" : "top-[calc(100%+6px)]"
            } ${ALIGN_CLASSES[align]} min-w-full rounded-[10px] bg-white p-2 shadow-[0_4px_20px_rgba(0,0,0,0.18)] ${panelClassName ?? ""}`}
          >
            {children}
          </div>
        )}
      </div>
    </PopoverContext.Provider>
  );
}

// ─── Convenience item (auto-closes on select) ────────────────────────────────
// Matches SelectOption's appearance exactly — every dropdown panel in the app
// (form Selects + custom status/category Popovers) renders options with the
// same chrome: neutral text, hover gray, selected = red text on pink bg + ✓.

interface PopoverItemProps {
  onSelect: () => void;
  selected?: boolean;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}

function PopoverItemCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M2.5 7.5 L5.5 10.5 L11.5 3.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PopoverItem({
  onSelect,
  selected = false,
  disabled = false,
  className,
  children,
}: PopoverItemProps) {
  const close = usePopoverClose();
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      disabled={disabled}
      onClick={() => {
        // Clicking the currently-selected option just closes the popover —
        // skip the onSelect call to avoid redundant state updates and to let
        // users dismiss by re-clicking their current choice.
        if (!selected) onSelect();
        close();
      }}
      className={[
        "flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-[14px] transition-colors",
        "hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
        selected ? "bg-brand-soft font-semibold text-brand" : "text-ink",
        className ?? "",
      ].join(" ")}
    >
      <span className="truncate">{children}</span>
      {selected && <PopoverItemCheck />}
    </button>
  );
}
