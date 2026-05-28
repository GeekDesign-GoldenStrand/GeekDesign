"use client";

import Link from "next/link";
import React from "react";

type NavLinkProps = {
  href: string;
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  expanded: boolean;
};

export function NavLink({ href, label, icon, isActive, expanded }: NavLinkProps) {
  return (
    <Link
      href={href}
      title={label}
      className={`relative flex items-center justify-start pl-5 md:pl-8 w-full h-20 md:h-12 transition-colors ${
        isActive ? "text-[#e42200]" : "text-[#575757] hover:text-[#e42200]"
      }`}
    >
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-3/5 bg-[#e42200] rounded-r-full" />
      )}

      <div
        className={`w-6 h-6 md:w-10 md:h-10 shrink-0 flex items-center justify-center transition-all duration-200 active:scale-90 ${
          expanded ? "mr-3" : "mr-0"
        }`}
      >
        {React.isValidElement(icon)
          ? React.cloneElement(
              icon as React.ReactElement<{ size?: string | number; weight?: string }>,
              {
                weight: isActive ? "fill" : "regular",
              }
            )
          : icon}
      </div>

      <span
        className={`text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-200 ${
          expanded ? "max-w-[140px] opacity-100" : "max-w-0 opacity-0"
        }`}
      >
        {label}
      </span>
    </Link>
  );
}
