"use client";

import { ConfirmDialog as SharedConfirmDialog } from "@/components/ui/atoms";

interface Props {
  open: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Backwards-compatible wrapper around the shared ConfirmDialog atom.
 * Preserves the legacy `open`/`onCancel` API and the "no volver a mostrar"
 * preference key used by existing call-sites.
 */
export function ConfirmDialog({ open, title, description, onConfirm, onCancel }: Props) {
  return (
    <SharedConfirmDialog
      isOpen={open}
      title={title}
      description={description}
      confirmLabel="Aceptar"
      onConfirm={onConfirm}
      onClose={onCancel}
      dontShowAgainKey="hideDeleteConfirmation"
    />
  );
}
