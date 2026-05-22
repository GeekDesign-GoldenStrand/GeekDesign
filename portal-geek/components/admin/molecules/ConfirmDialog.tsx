"use client";

import { useState } from "react";

import { DangerButton } from "../atoms/DangerButton";
import { PrimaryButton } from "../atoms/PrimaryButton";

interface Props {
  open: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, title, description, onConfirm, onCancel }: Props) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // Avoid rendering the overlay when the dialog is closed.
  // This keeps the DOM cleaner and prevents hidden modal content from being focusable.
  if (!open) return null;

  return (
    <div
      className="
        fixed
        inset-0
        bg-black/40
        flex
        items-center
        justify-center
        z-50
      "
    >
      <div
        className="
          bg-white
          rounded-2xl
          p-8
          w-full
          max-w-xl
          shadow-xl
          text-[#1E1E1E]
        "
      >
        <div className="flex justify-between items-start">
          <h2 className="text-3xl font-bold text-[#1E1E1E]">{title}</h2>

          <button onClick={onCancel} className="text-3xl text-[#1E1E1E] hover:text-black">
            ×
          </button>
        </div>

        <p className="mt-4 text-lg text-[#1E1E1E]">{description}</p>

        <div className="mt-6 flex items-center gap-2">
          <input
            type="checkbox"
            checked={dontShowAgain}
            onChange={() => setDontShowAgain(!dontShowAgain)}
          />

          <span className="text-[#4F4F4F] text-sm">No volver a mostrar este mensaje.</span>
        </div>

        <div className="flex justify-end gap-4 mt-8">
          <DangerButton onClick={onCancel}>Cancelar</DangerButton>

          <PrimaryButton
            onClick={() => {
              // Store this preference locally because it is a UI behavior,
              // not business data that belongs in the database.
              if (dontShowAgain) {
                localStorage.setItem("hideDeleteConfirmation", "true");
              }

              onConfirm();
            }}
          >
            Aceptar
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
