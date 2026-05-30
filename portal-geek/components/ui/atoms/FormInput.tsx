"use client";

import type { InputHTMLAttributes } from "react";

export interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string | null;
  required?: boolean;
  longText?: boolean;
  placeholderLongText?: string;
  maxInputLength: number;
}

const FIELD_BASE =
  "w-full border rounded-sm px-3 py-2 text-[14px] text-ink placeholder:text-ink-subtle transition-colors outline-none focus:border-brand focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1";

export default function FormInput({
  label,
  error,
  required,
  longText,
  placeholderLongText,
  maxInputLength,
  className,
  ...props
}: FormInputProps) {
  const errorId = error ? `${props.name}-error` : undefined;
  const borderClass = error ? "border-danger" : "border-line";

  return (
    <div className="flex flex-col gap-1 text-[13px] text-ink-muted mb-6">
      <span className="font-medium">
        {label}
        {required && <span className="ml-0.5 text-brand">*</span>}
      </span>
      {longText ? (
        <textarea
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          rows={4}
          cols={50}
          maxLength={maxInputLength}
          placeholder={placeholderLongText}
          value={props.value as string | undefined}
          onChange={props.onChange as unknown as React.ChangeEventHandler<HTMLTextAreaElement>}
          className={`${FIELD_BASE} ${borderClass}`}
        />
      ) : (
        <input
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          maxLength={maxInputLength}
          {...props}
          className={[FIELD_BASE, borderClass, className].filter(Boolean).join(" ")}
        />
      )}

      {error && (
        <p id={errorId} role="alert" className="mt-1 px-1 text-[13px] text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
