"use client";

import { X } from "@phosphor-icons/react";
import { useEffect, type ReactNode } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onApply?: () => void;
  onReset?: () => void;
  title?: string;
  applyLabel?: string;
  resetLabel?: string;
  children: ReactNode;
};

export function FilterSidebar({
  open,
  onClose,
  onApply,
  onReset,
  title = "Filtros",
  applyLabel = "Aplicar",
  resetLabel = "Restablecer",
  children,
}: Props) {
  function handleApply() {
    onApply?.();
    onClose();
  }

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      <div
        aria-hidden={!open}
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`fixed top-0 right-0 z-50 h-full w-full sm:w-[22rem] bg-white shadow-[0_0_30px_rgba(0,0,0,0.18)] text-black transform transition-transform duration-200 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-6 pt-6 pb-4">
            <h2 className="text-[24px] font-semibold text-[#1e1e1e]">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar filtros"
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-4">{children}</div>

          <div className="flex justify-center gap-3 px-6 py-4 border-t border-gray-100">
            {onReset && (
              <button
                type="button"
                onClick={onReset}
                className="h-9 px-4 rounded-[6px] bg-gray-200 text-gray-800 text-[13px] font-semibold hover:bg-gray-300 transition"
              >
                {resetLabel}
              </button>
            )}
            <button
              type="button"
              onClick={handleApply}
              className="h-9 px-6 rounded-[6px] bg-red-600 text-white text-[13px] font-semibold hover:bg-red-800 transition"
            >
              {applyLabel}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

const INPUT_CLASS =
  "w-full border border-gray-200 bg-gray-50 rounded-[6px] p-2 focus:outline-none focus:ring-2 focus:ring-gray-300 transition";

const SECTION_LABEL_CLASS = "text-[13px] font-semibold text-[#575757] mb-1";

const CHECKBOX_CLASS = "accent-gray-400";

export const filterSidebarClasses = {
  input: INPUT_CLASS,
  sectionLabel: SECTION_LABEL_CLASS,
  checkbox: CHECKBOX_CLASS,
};
