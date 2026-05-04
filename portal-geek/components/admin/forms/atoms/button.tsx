type ButtonVariant = "primary" | "secondary" | "outline";

type ButtonProps = {
  variant?: ButtonVariant;
  fullWidth?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  variant = "primary",
  fullWidth = false,
  className = "",
  children,
  ...props
}: ButtonProps) {
  const variants = {
    primary: "bg-[#e42200] text-white hover:bg-[#c41e00] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]",
    secondary: "bg-white text-[#1e1e1e] hover:bg-gray-100 border border-gray-300",
    outline: "bg-transparent text-[#e42200] hover:bg-[#e42200]/10 border border-[#e42200]",
  };

  return (
    <button
      className={`h-10 px-4 rounded-md font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
