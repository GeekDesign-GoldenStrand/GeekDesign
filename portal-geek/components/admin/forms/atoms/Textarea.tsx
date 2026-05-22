type TextareaProps = {
  label?: string;
  error?: string;
  required?: boolean;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ label, error, required, className = "", ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label className="text-base font-bold text-[#1e1e1e]">
          {label}
          {required && <span className="text-[#e42200] ml-1">*</span>}
        </label>
      )}
      <textarea
        className={`min-h-[100px] px-4 py-3 text-base rounded-md border border-gray-300 bg-white text-[#1e1e1e] placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#e42200] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed resize-y ${error ? "border-[#e42200]" : ""} ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-[#e42200]">{error}</span>}
    </div>
  );
}
