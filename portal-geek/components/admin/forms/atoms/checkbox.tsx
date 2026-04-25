type CheckboxProps = {
  label?: string;
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

export function Checkbox({ label, error, className = "", ...props }: CheckboxProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          className={`w-5 h-5 rounded border-gray-300 text-[#e42200] focus:ring-2 focus:ring-[#e42200] focus:ring-offset-0 cursor-pointer ${className}`}
          {...props}
        />
        {label && <span className="text-sm text-[#1e1e1e]">{label}</span>}
      </label>
      {error && <span className="text-xs text-[#e42200] ml-7">{error}</span>}
    </div>
  );
}