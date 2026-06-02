interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  /**
   * Caps how many characters the input accepts. Default 200 — long enough for
   * names/addresses, short enough that a paste-bomb can't lock up the page.
   * Forms with stricter server-side caps (e.g. a 50-char folio) should pass
   * their own matching value.
   */
  maxLength?: number;
}

// Generic controlled input for admin forms.
// Keeping labels and input styles together avoids duplicated form markup.
export function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  maxLength = 200,
}: Props) {
  return (
    <div className="flex flex-col gap-2">
      <label className="font-bold text-[#1E1E1E] text-[16px]">{label}</label>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        className="
          w-full
          rounded-md
          bg-white
          px-4
          py-3
          shadow-md
          outline-none
          border
          border-transparent
          focus:border-[#E42200]
          text-[#8E8E8E]
          placeholder:text-[#B1B1B1]
        "
      />
    </div>
  );
}
