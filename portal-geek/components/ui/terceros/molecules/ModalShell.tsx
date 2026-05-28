import { Modal } from "@/components/ui/atoms";

interface ModalShellProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  headerActions?: React.ReactNode;
  /**
   * Optional footer rendered below the scrollable body. Use this for action
   * buttons (Cancelar / Guardar) so they remain visible no matter how tall
   * the body content is — and crucially, so floating popovers inside the
   * body (e.g. MultiSelect dropdown) can't cover them.
   */
  footer?: React.ReactNode;
}

/**
 * Thin wrapper kept for existing terceros call-sites. New code should use the
 * shared <Modal> atom directly.
 */
export function ModalShell({ title, onClose, children, headerActions }: ModalShellProps) {
  return (
    <Modal isOpen onClose={onClose} title={title} headerActions={headerActions} size="lg">
      {children}
    </Modal>
  );
}
