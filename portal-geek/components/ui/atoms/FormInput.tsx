"use client";

import type { InputHTMLAttributes } from "react";

export interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  required?: boolean;
  longText?: boolean;
  placeholderLongText?: string;
  maxInputLength: number;
}

export default function FormInput({label, error, required, longText, placeholderLongText, maxInputLength, className, ...props} : FormInputProps) {
    const errorId = error ? `${props.name}-error` : undefined;

    return (
        <div className="flex flex-col gap-1 text-[13px] text-[#575757] mb-6">
              <span className="font-medium">{label}{required && <span className="text-[#e42200]">*</span>}</span>
              {longText 
              ?
              <textarea 
              className="w-full border border-[#b9b8b8] rounded-[6px] px-3 py-2 text-[14px] text-[#1e1e1e] outline-none focus:border-[#006aff] placeholder:text-[#8e908f] transition-colors" 
              id="myInput" 
              rows={4} 
              cols={50}
              maxLength={maxInputLength}
              placeholder={placeholderLongText}>
              </textarea>
              :
              <input
                aria-invalid={error ? true : undefined}
                aria-describedby={errorId}
                maxLength={maxInputLength}
                {...props}
                className={[
                  "w-full border border-[#b9b8b8] rounded-[6px] px-3 py-2 text-[14px] text-[#1e1e1e] outline-none focus:border-[#006aff] placeholder:text-[#8e908f] transition-colors",
                  className,
                ]
                  .filter(Boolean)
                  .join(" ")}
              />

              }
        
              {error && (
                <p id={errorId} role="alert" className="mt-1 px-4 text-[13px] text-[#df2646]">
                  {error}
                </p>
              )}
        </div>
    );
}