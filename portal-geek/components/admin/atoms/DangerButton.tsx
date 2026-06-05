interface Props {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string;
}

// Shared destructive-action button.
// Centralizing this style keeps delete/cancel actions visually consistent across admin forms.
export function DangerButton({ children, onClick, type = "button", className = "" }: Props) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`
        bg-[#FF0000]
        hover:bg-[#d10000]
        text-white
        px-6
        py-2
        rounded-xl
        font-medium
        transition
        ${className}
      `}
    >
      {children}
    </button>
  );
}
