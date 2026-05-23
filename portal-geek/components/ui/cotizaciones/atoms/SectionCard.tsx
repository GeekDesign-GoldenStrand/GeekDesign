import React from "react";

interface SectionCardProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function SectionCard({ title, icon, children, className = "" }: SectionCardProps) {
  return (
    <div className={`bg-white border border-gray-100 rounded-xl p-5 shadow-md ${className}`}>
      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
        {icon && <span className="text-[15px]">{icon}</span>}
        {title}
      </p>
      {children}
    </div>
  );
}
