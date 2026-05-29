"use client";

import {
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useEffect,
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

export function Popover({ trigger, align = "start", panelClassName, children }: PopoverProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  if (!isValidElement(trigger)) {
    throw new Error("Popover trigger must be a single React element");
  }

  const triggerProps = trigger.props;
  const wrappedTrigger = cloneElement(trigger, {
    onClick: (e: MouseEvent) => {
      triggerProps.onClick?.(e);
      setOpen((o) => !o);
    },
    "aria-expanded": open,
    "aria-haspopup": "menu",
  });

  const close = () => setOpen(false);

  return (
    <PopoverContext.Provider value={{ close }}>
      <div ref={containerRef} className="relative inline-block">
        {wrappedTrigger}
        {open && (
          <div
            role="menu"
            className={`absolute top-[calc(100%+6px)] z-50 ${ALIGN_CLASSES[align]} min-w-full rounded-[10px] bg-white p-2 shadow-[0_4px_20px_rgba(0,0,0,0.18)] ${panelClassName ?? ""}`}
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
      disabled={disabled || selected}
      onClick={() => {
        onSelect();
        close();
      }}
      className={[
        "flex w-full items-center justify-between gap-3 rounded-[8px] px-3 py-2 text-left text-[14px] transition-colors",
        "hover:bg-[#f5f5f5] disabled:cursor-default",
        selected ? "bg-[#fff0f2] font-semibold text-[#df2646]" : "text-[#1e1e1e]",
        className ?? "",
      ].join(" ")}
    >
      <span className="truncate">{children}</span>
      {selected && <PopoverItemCheck />}
    </button>
  );
}
