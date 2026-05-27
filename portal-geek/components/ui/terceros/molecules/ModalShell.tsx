import { X } from "@phosphor-icons/react";

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

export function ModalShell({ title, onClose, children, headerActions, footer }: ModalShellProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[12px] shadow-lg w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8e8e8] shrink-0">
          <h2 className="text-[20px] font-medium text-[#1e1e1e]">{title}</h2>
          <div className="flex items-center gap-2">
            {headerActions}
            <button
              onClick={onClose}
              className="text-[#8e908f] hover:text-[#e42200] transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto flex-1 min-h-0">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-[#e8e8e8] bg-white shrink-0">{footer}</div>
        )}
      </div>
    </div>
  );
}
