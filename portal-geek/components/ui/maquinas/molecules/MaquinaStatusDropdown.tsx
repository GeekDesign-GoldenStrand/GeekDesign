"use client";

import { useEffect, useRef, useState } from "react";
import { StatusTag, StatusValue } from "@/components/ui/atoms/StatusTag";
import { CheckIcon } from "../../atoms/icons";

interface MaquinaStatusDropdownProps {
  status: StatusValue;
  options: StatusValue[];
  optionColors: string[];
  onChange: (value: StatusValue) => void;
}

export default function MaquinaStatusDropdown({
  status,
  options,
  optionColors,
  onChange,
}: MaquinaStatusDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative inline-block">
      <button onClick={() => setIsOpen((prev) => !prev)}>
        <StatusTag status={status} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1 z-50 min-w-[110px] bg-white rounded-[7px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.18)] border border-gray-100 overflow-hidden">
          {options.map((option, index) => {
            const color = optionColors[index] ?? "#8e908f";
            return (
              <button
                key={option}
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-[14px] font-medium hover:bg-gray-50 flex items-center gap-2 ${option === status ? "opacity-50 cursor-default" : ""}`}
              >
                <span style={{ color }}>{option}</span>
                {option === status && <CheckIcon />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
