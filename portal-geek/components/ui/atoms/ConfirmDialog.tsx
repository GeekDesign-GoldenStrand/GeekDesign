"use client";

import { Warning, Question } from "@phosphor-icons/react";
import { useState, type ReactNode } from "react";

import { Modal } from "./Modal";

type ConfirmVariant = "danger" | "primary";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  /** Body copy. Accepts rich content (e.g. a bold entity name). */
  description: ReactNode;
  onConfirm: () => void;
  onClose: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Label shown on the confirm button while `loading`. Defaults per variant. */
  loadingLabel?: string;
  variant?: ConfirmVariant;
  loading?: boolean;
  /** Server/validation error shown above the actions. */
  error?: string | null;
  /** Override the default variant icon. */
  icon?: ReactNode;
  /** When set, renders a "No volver a mostrar" checkbox persisted to localStorage. */
  dontShowAgainKey?: string;
  /** Stack above another modal. */
  zClassName?: string;
}

const VARIANT = {
  danger: {
    icon: <Warning size={24} weight="fill" aria-hidden />,
    iconWrap: "bg-[#ffecec] text-[#e42200]",
    confirm: "bg-[#e42200] hover:bg-[#c01b00] focus-visible:ring-[#e42200] text-white",
    defaultLabel: "Eliminar",
    defaultLoading: "Eliminando...",
  },
  primary: {
    icon: <Question size={24} weight="fill" aria-hidden />,
    // Brand red (#df2646) — matches the admin Button's `admin` variant and the
    // Select focus ring / selected option styling. Earlier this variant used
    // blue (#006aff) which was visually inconsistent with the rest of the
    // admin UI; switched so non-destructive forward-action confirms (e.g.
    // "Cambiar estatus a Validada") read in the same brand color as every
    // other primary CTA in the section.
    iconWrap: "bg-[#fff0f2] text-[#df2646]",
    confirm: "bg-[#df2646] hover:bg-[#c41e3a] focus-visible:ring-[#df2646] text-white",
    defaultLabel: "Confirmar",
    defaultLoading: "Procesando...",
  },
} satisfies Record<ConfirmVariant, unknown>;

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
  loading = false,
  error = null,
  icon,
  dontShowAgainKey,
  zClassName,
}: ConfirmDialogProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const v = VARIANT[variant];

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
          <div className="text-[14px] leading-relaxed text-[#575757]">{description}</div>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-[6px] border border-[#e42200] bg-[#ffecec] px-4 py-2 text-[13px] text-[#e42200]"
          >
            {error}
          </div>
        )}

        {dontShowAgainKey && (
          <label className="flex cursor-pointer items-center gap-2 text-[13px] text-[#4f4f4f]">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={() => setDontShowAgain((prev) => !prev)}
              className="h-4 w-4 cursor-pointer accent-[#006aff]"
            />
            No volver a mostrar este mensaje.
          </label>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className={`rounded-[7px] px-5 py-2 text-[14px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-60 ${v.confirm}`}
          >
            {loading ? (loadingLabel ?? v.defaultLoading) : (confirmLabel ?? v.defaultLabel)}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-[7px] border border-[#b9b8b8] px-5 py-2 text-[14px] font-medium text-[#575757] transition-colors hover:bg-[#f5f5f5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#b9b8b8] disabled:opacity-60"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
