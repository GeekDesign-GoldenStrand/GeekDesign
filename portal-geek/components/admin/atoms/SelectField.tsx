interface Option {
  label: string;
  value: string;
}

interface Props {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
}

// Generic controlled select for simple catalog-like fields.
// Options are passed from the parent so the component stays reusable across modules.
export function SelectField({ label, value, options, onChange }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <label className="font-bold text-[#1E1E1E] text-[16px]">{label}</label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="
          rounded-xl
          border-2
          px-4
          py-2
          outline-none
          bg-white
          text-[#8E8E8E]
        "
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
