import type { ButtonHTMLAttributes } from "react";

export interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "red" | "wine";
}

const VARIANTS = {
  red: "bg-[#cf0015] hover:bg-[#b3000f] focus:ring-[#df2646]",
  wine: "bg-[#8b434a] hover:bg-[#7a3a41] focus:ring-[#df2646]",
} as const;

export function PrimaryButton({
  variant = "red",
  children,
  className,
  ...props
}: PrimaryButtonProps) {
  return (
    <button
      {...props}
      className={[
        "h-[63px] w-full rounded-[150px] font-semibold text-[20px] tracking-[1px] text-white",
        "transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60",
        VARIANTS[variant],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </button>
  );
}
