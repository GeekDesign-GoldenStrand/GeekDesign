"use client";

import { X } from "@phosphor-icons/react";
import { useEffect, useId, useRef } from "react";

type ModalSize = "sm" | "md" | "lg" | "xl" | "2xl";

const SIZE_CLASSES: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Optional title rendered in the header. Omit to render a headerless modal. */
  title?: string;
  children: React.ReactNode;
  /** Extra actions rendered to the left of the close button in the header. */
  headerActions?: React.ReactNode;
  size?: ModalSize;
  /** Set false to prevent backdrop click / Escape from closing (e.g. during submit). */
  dismissable?: boolean;
  /** Accessible name when rendering a headerless modal (no `title`). */
  ariaLabel?: string;
  /**
   * Drop the default padded/scrollable body wrapper so the consumer can render
   * its own header/body/footer sections inside the card (e.g. sticky footers).
   */
  noPadding?: boolean;
  /** Tailwind z-index class for the overlay. Bump for modals stacked over modals. */
  zClassName?: string;
}

/**
 * Shared modal shell for all admin/storefront dialogs.
 *
 * Closing on backdrop click only fires when the pointer is BOTH pressed and
 * released on the backdrop itself — dragging a text selection out of the modal
 * no longer closes it. Also handles Escape, body scroll lock and focus return.
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  headerActions,
  size = "lg",
  dismissable = true,
  ariaLabel,
  noPadding = false,
  zClassName = "z-50",
}: ModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  // Tracks whether the pointer was pressed down on the backdrop (not the dialog).
  const pressedOnBackdrop = useRef(false);

  // Escape to close.
  useEffect(() => {
    if (!isOpen || !dismissable) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, dismissable, onClose]);

  // Lock body scroll while open and restore focus to the trigger on close.
  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 ${zClassName} flex items-center justify-center bg-black/40 backdrop-blur-sm p-4`}
      onMouseDown={(e) => {
        pressedOnBackdrop.current = e.target === e.currentTarget;
      }}
      onMouseUp={(e) => {
        if (dismissable && pressedOnBackdrop.current && e.target === e.currentTarget) {
          onClose();
        }
        pressedOnBackdrop.current = false;
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={!title ? ariaLabel : undefined}
        tabIndex={-1}
        className={`flex max-h-[90vh] w-full ${SIZE_CLASSES[size]} flex-col overflow-hidden rounded-[12px] bg-white shadow-lg outline-none`}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-[#e8e8e8] px-6 py-4">
            <h2 id={titleId} className="text-[20px] font-medium text-[#1e1e1e]">
              {title}
            </h2>
            <div className="flex items-center gap-2">
              {headerActions}
              {/* Hide the close affordance while non-dismissable (e.g. mid-submit)
                  so it can't bypass the Escape/backdrop lock. */}
              {dismissable && (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Cerrar modal"
                  className="rounded text-[#8e908f] transition-colors hover:text-[#e42200] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e42200]"
                >
                  <X size={20} aria-hidden />
                </button>
              )}
            </div>
          </div>
        )}
        {noPadding ? children : <div className="overflow-y-auto p-6">{children}</div>}
      </div>
    </div>
  );
}
