"use client";

interface PromoButtonProps {
  text: string;
  onClick?: () => void;
  className?: string;
  variant?: "primary" | "outline";
}

export function PromoButton({ text, onClick, className = "", variant = "primary" }: PromoButtonProps) {
  if (variant === "primary") {
    return (
      <button 
        onClick={onClick}
        className={`group relative bg-white text-black px-10 py-4 text-xs font-bold uppercase tracking-[0.2em] overflow-hidden transition-all duration-500 hover:text-white ${className}`}
      >
        <span className="relative z-10">{text}</span>
        <div className="absolute inset-0 bg-black translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out"></div>
      </button>
    );
  }

  // Add more variants if needed
  return (
    <button onClick={onClick} className={`text-sm font-bold uppercase tracking-[0.2em] border-b border-black text-black w-fit pb-1 hover:opacity-40 transition-all ${className}`}>
      {text}
    </button>
  );
}
