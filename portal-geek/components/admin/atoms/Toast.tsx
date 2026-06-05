import { WarningCircle } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";

interface ToastProps {
  message: string | null;
}

export function Toast({ message }: ToastProps) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
          className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 bg-neutral-900 text-white px-5 py-3.5 rounded-2xl shadow-xl z-50 flex items-center gap-3 border border-neutral-800"
        >
          <WarningCircle size={22} className="text-amber-500" weight="fill" />
          <span className="font-medium text-sm sm:text-base">{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
