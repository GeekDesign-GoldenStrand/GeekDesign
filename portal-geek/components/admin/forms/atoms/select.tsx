type SelectOption = {
  value: string | number;
  label: string;
};

type SelectProps = {
  label?: string;
  error?: string;
  required?: boolean;
  options: SelectOption[];
  placeholder?: string;
} & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "children">;

export function Select({ label, error, required, options, placeholder, className = "", ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label className="text-sm font-medium text-[#1e1e1e]">
          {label}
          {required && <span className="text-[#e42200] ml-1">*</span>}
        </label>
      )}
      <select
        className={`h-10 px-3 rounded-md border border-gray-300 bg-white text-[#1e1e1e] focus:outline-none focus:ring-2 focus:ring-[#e42200] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${error ? "border-[#e42200]" : ""} ${className}`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-[#e42200]">{error}</span>}
    </div>
  );
}