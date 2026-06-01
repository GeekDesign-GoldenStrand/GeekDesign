import React from "react";

interface FieldRowProps {
  label: React.ReactNode;
  value: React.ReactNode;
  last?: boolean;
}

export function FieldRow({ label, value, last }: FieldRowProps) {
  return (
    <div
      className={`flex justify-between items-baseline gap-3 py-[7px] text-sm min-w-0 ${
        last ? "" : "border-b border-gray-100"
      }`}
    >
      <span className="text-gray-400 shrink-0">{label}</span>
      <span className="font-medium text-gray-900 text-right min-w-0 break-words">{value}</span>
    </div>
  );
}
