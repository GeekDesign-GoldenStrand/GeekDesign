"use client";

import { CheckCircleIcon, WarningCircle } from "@phosphor-icons/react";
import { useEffect } from "react";

interface SuccessModalProps {
  message: string;
  onClose: () => void;
  variant?: "success" | "error";
}

export function SuccessModal({ message, onClose, variant = "success" }: SuccessModalProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 1500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-[12px] shadow-lg w-full max-w-lg overflow-hidden flex flex-col">
        <div className="flex items-center justify-center px-6 py-4 border-b border-[#e8e8e8]">
          <h2 className="text-[20px] font-medium text-[#1e1e1e] text-center leading-snug">
            {message}
          </h2>
        </div>
        <div className="flex items-center justify-center p-8">
          {variant === "error" ? (
            <WarningCircle size={72} weight="regular" className="text-[#e42200]" />
          ) : (
            <CheckCircleIcon size={72} weight="regular" className="text-[#166534]" />
          )}
        </div>
      </div>
    </div>
  );
}
