"use client";

import { XIcon } from "@phosphor-icons/react";

import type { UserRole } from "@/types";

import { LogoutButton } from "./atoms/LogoutButton";
import { SidebarLogo } from "./atoms/SidebarLogo";
import { SidebarNav } from "./molecules/SidebarNav";

type SidebarProps = {
  role: UserRole;
  expanded: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
};

export function Sidebar({
  role,
  expanded,
  mobileOpen,
  onMobileClose,
  onMouseEnter,
  onMouseLeave,
}: SidebarProps) {
  return (
    <aside
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`fixed left-0 top-0 h-screen bg-white shadow-[0px_4px_10px_rgba(0,0,0,0.08)] flex flex-col items-center py-2 z-50 border-r border-[#F0F0F0] overflow-hidden transition-[width,transform] duration-250 ease-in-out w-52 md:translate-x-0 ${
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      } ${expanded ? "md:w-52" : "md:w-25.5"}`}
    >
      <button
        type="button"
        aria-label="Cerrar menú"
        className="absolute top-4 right-4 md:hidden text-[#575757] hover:text-[#e42200] transition-colors"
        onClick={onMobileClose}
      >
        <XIcon size={20} />
      </button>

      <SidebarLogo />
      <div className="flex-1 w-full overflow-y-auto">
        <SidebarNav role={role} expanded={mobileOpen || expanded} />
      </div>
      <LogoutButton />
    </aside>
  );
}
