type inputProps = {
  label?: string;
  error?: string;
  required?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ label, error, required, className = "", ...props }: inputProps) {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label className="text-base font-bold text-[#1e1e1e]">
          {label}
          {required && <span className="text-[#e42200] ml-1">*</span>}
        </label>
      )}
      <input
        className={`h-12 px-4 text-[15px] rounded-[10px] border border-[#b9b8b8] bg-white text-[#1e1e1e] focus:outline-none focus:ring-2 focus:ring-[#df2646] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${error ? "border-[#df2646]" : ""} ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-[#e42200]">{error}</span>}
    </div>
  );
}
