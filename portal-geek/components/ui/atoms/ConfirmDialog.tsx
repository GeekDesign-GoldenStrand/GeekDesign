"use client";

import { Warning, Question } from "@phosphor-icons/react";
import { useState, type ReactNode } from "react";

import { Modal } from "./Modal";

// Two purposes, two visuals:
//   variant="primary"  → constructive ("Aprobar", "Continuar", "Guardar"). Uses
//                        the section's brand color (admin = brand red, storefront
//                        = wine) so the dialog matches its host page.
//   variant="danger"   → destructive ("Eliminar", "Cancelar pedido"). Uses the
//                        `danger` token (rose) so it's visually distinct from
//                        the constructive variant.

type ConfirmVariant = "danger" | "primary";
type Section = "admin" | "storefront";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: ReactNode;
  onConfirm: () => void;
  onClose: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  loadingLabel?: string;
  variant?: ConfirmVariant;
  /** Which surface this dialog renders on. Drives the primary-variant color. */
  section?: Section;
  loading?: boolean;
  error?: string | null;
  icon?: ReactNode;
  dontShowAgainKey?: string;
  zClassName?: string;
}

const DANGER_STYLE = {
  icon: <Warning size={24} weight="fill" aria-hidden />,
  iconWrap: "bg-danger-soft text-danger",
  confirm: "bg-danger hover:brightness-95 focus-visible:ring-danger text-white",
  defaultLabel: "Eliminar",
  defaultLoading: "Eliminando...",
};

const PRIMARY_STYLE: Record<Section, typeof DANGER_STYLE> = {
  admin: {
    icon: <Question size={24} weight="fill" aria-hidden />,
    iconWrap: "bg-brand-soft text-brand",
    confirm: "bg-brand hover:bg-brand-hover focus-visible:ring-brand text-white",
    defaultLabel: "Confirmar",
    defaultLoading: "Procesando...",
  },
  storefront: {
    icon: <Question size={24} weight="fill" aria-hidden />,
    iconWrap: "bg-wine-soft text-wine",
    confirm: "bg-wine hover:bg-wine-hover focus-visible:ring-wine text-white",
    defaultLabel: "Confirmar",
    defaultLoading: "Procesando...",
  },
};

export function ConfirmDialog({
  isOpen,
  title,
  description,
  onConfirm,
  onClose,
  confirmLabel,
  cancelLabel = "Cancelar",
  loadingLabel,
  variant = "danger",
  section = "admin",
  loading = false,
  error = null,
  icon,
  dontShowAgainKey,
  zClassName,
}: ConfirmDialogProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const v = variant === "danger" ? DANGER_STYLE : PRIMARY_STYLE[section];

  function handleConfirm() {
    if (dontShowAgainKey && dontShowAgain) {
      localStorage.setItem(dontShowAgainKey, "true");
    }
    onConfirm();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="md"
      dismissable={!loading}
      zClassName={zClassName}
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-start gap-4">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${v.iconWrap}`}
          >
            {icon ?? v.icon}
          </span>
          <div className="text-[14px] leading-relaxed text-ink-muted">{description}</div>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-sm border border-danger bg-danger-soft px-4 py-2 text-[13px] text-danger"
          >
            {error}
          </div>
        )}

        {dontShowAgainKey && (
          <label className="flex cursor-pointer items-center gap-2 text-[13px] text-ink-muted">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={() => setDontShowAgain((prev) => !prev)}
              className="h-4 w-4 cursor-pointer accent-brand"
            />
            No volver a mostrar este mensaje.
          </label>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-sm border border-line px-5 py-2 text-[14px] font-medium text-ink-muted transition-colors hover:bg-surface-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-line disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className={`rounded-sm px-5 py-2 text-[14px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-60 ${v.confirm}`}
          >
            {loading ? (loadingLabel ?? v.defaultLoading) : (confirmLabel ?? v.defaultLabel)}
          </button>
        </div>
      </div>
    </Modal>
  );
}
