"use client";

import Link from "next/link";
import React from "react";

type NavLinkProps = {
  href: string;
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
};

export function NavLink({ href, label, icon, isActive }: NavLinkProps) {
  return (
    <Link
      href={href}
      title={label}
      className={`relative flex items-center justify-center w-full h-12 md:h-16 transition-all ${
        isActive ? "text-[#e42200]" : "text-[#575757] hover:text-[#e42200]"
      }`}
    >
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-3/5 bg-[#e42200] rounded-r-full" />
      )}

      {/* Icon Container with responsive sizing */}
      <div className="w-6 h-6 md:w-10 md:h-10 transition-transform duration-200 active:scale-90 flex items-center justify-center">
        {React.isValidElement(icon)
          ? React.cloneElement(
              icon as React.ReactElement<{ size?: string | number; weight?: string }>,
              {
                size: "100%",
                weight: isActive ? "fill" : "regular",
              }
            )
          : icon}
      </div>
    </Link>
  );
}
