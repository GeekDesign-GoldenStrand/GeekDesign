"use client";

import { useState } from "react";

interface Props {
  availableYears: number[];
  selectedYears: number[];
  onChange: (year: number) => void;
}

export function YearMultiSelect({ availableYears, selectedYears, onChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 flex items-center gap-2 shadow-sm transition-all"
      >
        Años a comparar ({selectedYears.length})
        <svg
          className="w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          ></path>
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
            <div className="p-2 flex flex-col gap-1">
              {availableYears
                .sort((a, b) => b - a)
                .map((year) => (
                  <label
                    key={year}
                    className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedYears.includes(year)}
                      onChange={() => onChange(year)}
                      className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500 cursor-pointer transition-all"
                    />
                    <span className="text-sm font-medium text-gray-700">{year}</span>
                  </label>
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
