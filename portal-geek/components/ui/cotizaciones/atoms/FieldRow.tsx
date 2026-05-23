import React from "react";

interface FieldRowProps {
  label: React.ReactNode;
  value: React.ReactNode;
  last?: boolean;
}

export const FieldRow: React.FC<FieldRowProps> = ({ label, value, last }) => (
  <div
    className={`flex justify-between items-baseline py-[7px] text-sm ${
      last ? "" : "border-b border-gray-100"
    }`}
  >
    <span className="text-gray-400">{label}</span>
    <span className="font-medium text-gray-900 text-right">{value}</span>
  </div>
);
