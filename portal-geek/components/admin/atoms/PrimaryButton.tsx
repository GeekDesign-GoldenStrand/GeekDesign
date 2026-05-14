interface Props {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
}

// Shared primary-action button.
// It is used for confirmation actions so forms keep the same visual hierarchy.
export function PrimaryButton({
  children,
  onClick,
  type = "button",
  disabled = false,
  className = "",
}: Props) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        bg-[#2A940D]
        hover:bg-[#237d0b]
        text-white
        px-6
        py-2
        rounded-xl
        font-medium
        transition
        disabled:opacity-50
        ${className}
      `}
    >
      {children}
    </button>
  );
}
