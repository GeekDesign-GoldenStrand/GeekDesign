"use client";

import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import "react-phone-number-input/style.css";

type Props = {
  value: string;
  onChange: (e164: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  hasError?: boolean;
  onBlur?: () => void;
};

export function PhoneInputMX({
  value,
  onChange,
  placeholder,
  disabled,
  id,
  hasError,
  onBlur,
}: Props) {
  return (
    <PhoneInput
      id={id}
      international
      defaultCountry="MX"
      flags={flags}
      value={value || undefined}
      onChange={(v) => onChange(v ?? "")}
      disabled={disabled}
      numberInputProps={{
        placeholder,
        inputMode: "tel",
        onBlur,
      }}
      className={[
        "flex items-center gap-2 h-[38px] rounded-[6px] border bg-white px-3 text-[14px] text-[#1e1e1e] transition-colors",
        "focus-within:border-[#006aff]",
        "[&_.PhoneInputInput]:flex-1 [&_.PhoneInputInput]:border-none [&_.PhoneInputInput]:outline-none",
        "[&_.PhoneInputInput]:bg-transparent [&_.PhoneInputInput]:[font:inherit] [&_.PhoneInputInput]:[color:inherit]",
        "[&_.PhoneInputInput]:p-0 [&_.PhoneInputInput]:h-full",
        "[&_.PhoneInputInput::placeholder]:text-[#8e908f]",
        "[&_.PhoneInputCountry]:mr-0",
        hasError ? "border-[#e42200]" : "border-[#b9b8b8]",
      ].join(" ")}
    />
  );
}

export { isValidPhoneNumber };
