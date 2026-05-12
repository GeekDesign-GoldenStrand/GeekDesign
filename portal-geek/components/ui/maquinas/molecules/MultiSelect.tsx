"use client";

import type { KeyboardEvent } from "react";
import { useState, useRef, useEffect } from "react";

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
}

export default function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Seleccionar...",
  label,
  disabled = false,
  maxSelected,
}: MultiSelectProps) {
  const [selected, setSelected] = useState<MultiSelectOption[]>(value ?? []);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    if (value !== undefined) setSelected(value);
  }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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
    inputRef.current?.focus();
  };

  const removeTag = (value: string | number) => {
    const next = selected.filter((s) => s.value !== value);
    setSelected(next);
    onChange?.(next);
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
      toggle(filtered[0]);
      setSearch("");
    }
  };

  const isMaxReached = maxSelected !== undefined && selected.length >= maxSelected;

  return (
    <div className="flex flex-col gap-1 w-full font-ibm-plex-sans mb-6" ref={containerRef}>
      {label && <label className="text-[13px] font-medium text-[#575757]">{label}</label>}

      <div
        className={[
          "flex flex-wrap items-center gap-1.5 min-h-[42px] w-full border border-[#b9b8b8] rounded-[6px] px-3 py-2 text-[14px] text-[#1e1e1e] outline-none focus:border-[#006aff] placeholder:text-[#575757] transition-all",
          disabled ? "opacity-50 cursor-not-allowed bg-gray-50" : "",
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
            className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-50 text-red-700 text-sm text-[#8e908f]font-medium border border-red-200"
          >
            {s.label}
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(s.value);
                }}
                className="text-red-400 hover:text-red-700 transition-colors leading-none"
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
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={selected.length === 0 ? placeholder : ""}
            className="flex-1 min-w-[120px] outline-none text-sm text-[#8e908f] placeholder:text-[#8e908f] bg-transparent"
          />
        )}

        <span
          className="ml-auto pl-1 text-gray-400 transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
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
        </span>
      </div>

      {isMaxReached && <p className="text-xs text-gray-400">Máximo {maxSelected} seleccionados</p>}

      {/* Dropdown */}
      {open && !disabled && (
        <div className="relative z-50">
          <div className="absolute top-1 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-sm text-gray-400">
                {search ? "Sin resultados" : "No hay más opciones"}
              </p>
            ) : (
              <ul className="max-h-56 overflow-y-auto py-1">
                {filtered.map((option) => (
                  <li
                    key={option.value}
                    onClick={() => toggle(option)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 cursor-pointer transition-colors"
                  >
                    <span className="w-4 h-4 rounded border border-gray-300 flex items-center justify-center flex-shrink-0"></span>
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
