import { Modal } from "@/components/ui/atoms";

interface ModalShellProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  headerActions?: React.ReactNode;
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
