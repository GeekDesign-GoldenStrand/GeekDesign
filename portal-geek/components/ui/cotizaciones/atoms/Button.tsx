import React from "react";

type ButtonVariant = "default" | "primary" | "amber" | "danger";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  default:
    "border border-gray-200 bg-transparent text-gray-800 hover:bg-gray-50 active:scale-[0.98]",
  primary: "border border-[#1D9E75] bg-[#1D9E75] text-white hover:bg-[#0F6E56] active:scale-[0.98]",
  amber:
    "border border-[#FAC775] bg-[#FAEEDA] text-[#633806] hover:bg-[#FAC775] active:scale-[0.98]",
  danger:
    "border border-[#F09595] bg-transparent text-[#A32D2D] hover:bg-[#FCEBEB] active:scale-[0.98]",
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export function Button({
  variant = "default",
  icon,
  children,
  className = "",
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-medium
        transition-all duration-100 cursor-pointer
        ${VARIANT_CLASSES[variant]}
        ${className}
      `}
      {...rest}
    >
      {icon && <span className="text-[15px] leading-none">{icon}</span>}
      {children}
    </button>
  );
}
