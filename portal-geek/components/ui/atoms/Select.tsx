"use client";

import {
  Children,
  createContext,
  isValidElement,
  useContext,
  type ReactElement,
  type ReactNode,
} from "react";

import { Popover, usePopoverClose } from "@/components/ui/primitives/Popover";

// Canonical themed select. Built on Popover so the open dropdown panel uses
// our theme (rounded corners, brand focus colors) on every browser/OS —
// native <select> open lists are owned by the OS and can't be themed.
//
// Form validation note: this is NOT a native <select>, so HTML5 `required`
// validation does not run on it. Forms must validate the selected value
// themselves in their submit handler.

type Size = "sm" | "md";

const SIZE_TRIGGER: Record<Size, string> = {
  sm: "h-10 rounded-[8px] px-3 text-sm",
  md: "h-12 rounded-[10px] px-4 text-[15px]",
};

// ─── Context (used by SelectOption) ──────────────────────────────────────────

interface SelectContextValue {
  value: string;
  onSelect: (value: string) => void;
}
const SelectContext = createContext<SelectContextValue | null>(null);

// ─── Icons ───────────────────────────────────────────────────────────────────

function CaretDown() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden
      className="shrink-0 text-[#575757]"
    >
      <path
        d="M3 5 L7 9 L11 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Check() {
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

// ─── Select ──────────────────────────────────────────────────────────────────

export interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  size?: Size;
  /** Text shown in the trigger when no option is selected. */
  placeholder?: string;
  /** Red border + helper text when set. */
  error?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  "aria-label"?: string;
}

interface SelectOptionElementProps {
  value: string;
  children: ReactNode;
}

export function Select({
  value,
  onChange,
  children,
  size = "md",
  placeholder = "Selecciona una opción",
  error,
  disabled,
  id,
  className,
  "aria-label": ariaLabel,
}: SelectProps) {
  // Walk children to find the selected option and render its label in the trigger.
  const childArr = Children.toArray(children);
  const selected = childArr.find(
    (c): c is ReactElement<SelectOptionElementProps> =>
      isValidElement<SelectOptionElementProps>(c) && c.props.value === value
  );
  const label = selected ? selected.props.children : null;

  const borderClass = error ? "border-[#df2646]" : "border-[#b9b8b8]";
  const triggerClass = [
    "w-full bg-white text-[#1e1e1e] border transition-colors",
    "flex items-center justify-between gap-2",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#df2646] focus-visible:ring-offset-1",
    "disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60",
    SIZE_TRIGGER[size],
    borderClass,
    className ?? "",
  ].join(" ");

  return (
    <div className="flex w-full flex-col gap-1">
      <Popover
        align="start"
        panelClassName="w-full p-1"
        trigger={
          <button
            type="button"
            id={id}
            disabled={disabled}
            aria-label={ariaLabel}
            className={triggerClass}
          >
            <span className={label ? "truncate" : "truncate text-[#8e908f]"}>
              {label ?? placeholder}
            </span>
            <CaretDown />
          </button>
        }
      >
        <SelectContext.Provider value={{ value, onSelect: onChange }}>
          {/* Wrapper is presentational — Popover panel already has role="listbox",
              so nesting another listbox here would be invalid ARIA. */}
          <div className="flex flex-col">{children}</div>
        </SelectContext.Provider>
      </Popover>
      {error && (
        <p role="alert" className="px-1 text-[13px] text-[#df2646]">
          {error}
        </p>
      )}
    </div>
  );
}

// ─── SelectOption ────────────────────────────────────────────────────────────

export interface SelectOptionProps {
  value: string;
  children: ReactNode;
  disabled?: boolean;
}

export function SelectOption({ value, children, disabled }: SelectOptionProps) {
  const ctx = useContext(SelectContext);
  const close = usePopoverClose();
  if (!ctx) {
    throw new Error("SelectOption must be used inside <Select>");
  }
  const selected = ctx.value === value;

  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      disabled={disabled}
      onClick={() => {
        ctx.onSelect(value);
        close();
      }}
      className={[
        "flex w-full items-center justify-between gap-3 rounded-[8px] px-3 py-2 text-left text-[14px] transition-colors",
        "hover:bg-[#f5f5f5] disabled:cursor-not-allowed disabled:opacity-50",
        selected ? "bg-[#fff0f2] font-semibold text-[#df2646]" : "text-[#1e1e1e]",
      ].join(" ")}
    >
      <span className="truncate">{children}</span>
      {selected && <Check />}
    </button>
  );
}
