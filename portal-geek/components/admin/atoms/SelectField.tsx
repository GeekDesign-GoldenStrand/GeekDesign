interface Option {
  label: string;
  value: string | number;
}

interface Props {
  label?: string;
  value: string | number;
  options: Option[];
  onChange: (value: string) => void;
  inline?: boolean;
  selectClassName?: string;
  containerClassName?: string;
}

// Generic controlled select for simple catalog-like fields.
// Options are passed from the parent so the component stays reusable across modules.
export function SelectField({
  label,
  value,
  options,
  onChange,
  inline,
  selectClassName,
  containerClassName,
}: Props) {
  return (
    <div
      className={`flex ${inline ? "flex-row items-center gap-2" : "flex-col gap-2"} ${containerClassName || ""}`}
    >
      {label && (
        <label
          className={inline ? "text-gray-500 font-medium" : "font-bold text-[#1E1E1E] text-[16px]"}
        >
          {label}
        </label>
      )}

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={
          selectClassName ||
          `
          rounded-xl
          border-2
          px-4
          py-2
          outline-none
          bg-white
          text-[#8E8E8E]
        `
        }
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
