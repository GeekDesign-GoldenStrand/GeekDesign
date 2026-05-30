"use client";

import type { KeyboardEvent } from "react";
import { useEffect, useId, useRef, useState } from "react";

export interface MultiSelectOption {
  value: string | number;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  value?: MultiSelectOption[];
  onChange?: (selected: MultiSelectOption[]) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  maxSelected?: number;
  required?: boolean;
  error?: string;
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Seleccionar...",
  label,
  disabled = false,
  maxSelected,
  required,
  error,
}: MultiSelectProps) {
  const [selected, setSelected] = useState<MultiSelectOption[]>(value ?? []);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fieldId = useId();
  const errorId = `${fieldId}-error`;

  const filtered = options.filter(
    (o) =>
      o.label.toLowerCase().includes(search.toLowerCase()) &&
      !selected.find((s) => s.value === o.value)
  );

  const toggle = (option: MultiSelectOption) => {
    const isSelected = selected.find((s) => s.value === option.value);
    let next: MultiSelectOption[];

    if (isSelected) {
      next = selected.filter((s) => s.value !== option.value);
    } else {
      if (maxSelected && selected.length >= maxSelected) return;
      next = [...selected, option];
    }

    setSelected(next);
    onChange?.(next);
    setSearch("");
    inputRef.current?.focus();
  };

  const removeTag = (v: string | number) => {
    const next = selected.filter((s) => s.value !== v);
    setSelected(next);
    onChange?.(next);
  };

  const toggleDropdown = () => {
    setOpen((wasOpen) => {
      if (wasOpen) {
        setSearch("");
        return false;
      }
      inputRef.current?.focus();
      return true;
    });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && search === "" && selected.length > 0) {
      removeTag(selected[selected.length - 1].value);
    }
    if (e.key === "Escape") {
      setOpen(false);
      setSearch("");
    }
    if (e.key === "Enter" && filtered.length > 0) {
      e.preventDefault();
      toggle(filtered[0]);
      setSearch("");
    }
  };

  const isMaxReached = maxSelected !== undefined && selected.length >= maxSelected;

  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  return (
    <div className="flex flex-col gap-1 w-full font-ibm-plex-sans" ref={containerRef}>
      {label && (
        <label htmlFor={fieldId} className="text-[13px] font-medium text-ink-muted">
          {label}
          {required && <span className="ml-0.5 text-brand">*</span>}
        </label>
      )}

      <div
        className={[
          "flex flex-wrap items-center gap-1.5 min-h-[42px] w-full",
          "border rounded-sm px-3 py-2 text-[14px] text-ink transition-colors",
          "focus-within:border-brand focus-within:ring-2 focus-within:ring-brand focus-within:ring-offset-1",
          error ? "border-danger" : "border-line",
          disabled ? "opacity-50 cursor-not-allowed bg-surface-muted" : "",
        ].join(" ")}
        onClick={() => {
          if (!disabled) {
            setOpen(true);
            inputRef.current?.focus();
          }
        }}
      >
        {selected.map((s) => (
          <span
            key={s.value}
            className="flex items-center gap-1 px-2 py-0.5 rounded-sm bg-brand-soft text-brand text-sm font-medium border border-brand-softer"
          >
            {s.label}
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(s.value);
                }}
                className="text-brand hover:opacity-70 transition-opacity leading-none"
                aria-label={`Eliminar ${s.label}`}
              >
                ×
              </button>
            )}
          </span>
        ))}

        {!disabled && !isMaxReached && (
          <input
            ref={inputRef}
            id={fieldId}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={selected.length === 0 ? placeholder : ""}
            maxLength={50}
            aria-describedby={error ? errorId : undefined}
            aria-invalid={error ? true : undefined}
            className="flex-1 min-w-[120px] outline-none text-sm text-ink placeholder:text-ink-subtle bg-transparent"
          />
        )}

        <button
          type="button"
          className="ml-auto pl-1 text-ink-subtle transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
          aria-label={open ? "Cerrar opciones" : "Abrir opciones"}
          onClick={(e) => {
            e.stopPropagation();
            toggleDropdown();
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M4 6l4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {isMaxReached && (
        <p className="text-xs text-ink-subtle">Máximo {maxSelected} seleccionados</p>
      )}

      {error && (
        <p id={errorId} role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}

      {open && !disabled && (
        <div className="relative z-50">
          <div
            className="absolute top-1 left-0 right-0 bg-white border border-line-soft rounded-lg shadow-lg overflow-hidden"
            role="listbox"
            aria-multiselectable
          >
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-sm text-ink-subtle">
                {search ? "Sin resultados" : "No hay más opciones"}
              </p>
            ) : (
              <ul className="max-h-56 overflow-y-auto py-1">
                {filtered.map((option) => (
                  <li
                    key={option.value}
                    role="option"
                    aria-selected={false}
                    onClick={() => toggle(option)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-ink hover:bg-surface-muted cursor-pointer transition-colors"
                  >
                    <span className="w-4 h-4 rounded-xs border border-line flex items-center justify-center flex-shrink-0" />
                    {option.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default MultiSelect;
