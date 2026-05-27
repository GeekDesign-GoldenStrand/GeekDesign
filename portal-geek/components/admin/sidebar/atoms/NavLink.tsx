"use client";

import Link from "next/link";
import React from "react";

type NavLinkProps = {
  href: string;
  label: string;
  icon: React.ReactNode;
  /**
   * Optional pre-rendered icon for the hover state. Used for custom SVGs
   * that can't pick up hover via currentColor on the parent link. Phosphor
   * entries leave this undefined and get hover via the link's text color.
   */
  iconHover?: React.ReactNode;
  /**
   * Optional pre-rendered icon for the active state. When provided it's used
   * verbatim (no `weight` swap). For Phosphor entries leave this undefined
   * and the regular icon picks up `weight: "fill"` via cloneElement.
   */
  iconActive?: React.ReactNode;
  isActive: boolean;
};

export function NavLink({ href, label, icon, iconHover, iconActive, isActive }: NavLinkProps) {
  // Decide which icon-render path to take. Custom assets (iconHover /
  // iconActive) opt out of Phosphor's weight cloneElement entirely.
  // Precedence: active > hover. The active state is rendered verbatim;
  // hover-only items render base + hover icons stacked and swap via
  // group-hover. Plain Phosphor items keep the weight-swap path.
  const useCustomActive = isActive && iconActive != null;
  const useCustomHover = !isActive && iconHover != null;

  let iconContent: React.ReactNode;
  if (useCustomActive) {
    iconContent = iconActive;
  } else if (useCustomHover) {
    iconContent = (
      <>
        <span className="block group-hover:hidden">{icon}</span>
        <span className="hidden group-hover:block">{iconHover}</span>
      </>
    );
  } else if (React.isValidElement(icon)) {
    iconContent = React.cloneElement(
      icon as React.ReactElement<{ size?: string | number; weight?: string }>,
      {
        weight: isActive ? "fill" : "regular",
      }
    );
  } else {
    iconContent = icon;
  }

  return (
    <Link
      href={href}
      title={label}
      className={`group relative flex items-center justify-center w-full h-20 md:h-12 transition-all ${
        isActive ? "text-[#e42200]" : "text-[#575757] hover:text-[#e42200]"
      }`}
    >
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-3/5 bg-[#e42200] rounded-r-full" />
      )}

      {/* Icon Container with responsive sizing */}
      <div className="w-6 h-6 md:w-10 md:h-10 transition-transform duration-200 active:scale-90 flex items-center justify-center">
        {iconContent}
      </div>
    </Link>
  );
}
