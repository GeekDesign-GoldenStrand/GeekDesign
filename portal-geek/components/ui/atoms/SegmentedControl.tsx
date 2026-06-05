"use client";

import type { ReactNode } from "react";

export interface SegmentedControlOption<T extends string | number> {
  label: ReactNode;
  value: T;
}

interface SegmentedControlProps<T extends string | number> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  className = "",
}: SegmentedControlProps<T>) {
  return (
    <div className={`flex bg-[#f1f3f5] p-1 rounded-full shadow-inner ${className}`}>
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <button
            key={String(option.value)}
            type="button"
            onClick={() => onChange(option.value)}
            className={`flex-1 min-w-[100px] py-1 px-8 text-[13px] font-medium whitespace-nowrap rounded-full transition-all duration-300 ${
              isActive
                ? "bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] text-[#006aff] scale-100"
                : "text-[#575757] hover:text-[#1e1e1e] hover:bg-[#e8ecef] scale-[0.98]"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
