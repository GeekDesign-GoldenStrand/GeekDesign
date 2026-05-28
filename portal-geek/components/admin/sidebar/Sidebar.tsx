"use client";

import { useRef, useState } from "react";

import type { UserRole } from "@/types";

import { LogoutButton } from "./atoms/LogoutButton";
import { SidebarLogo } from "./atoms/SidebarLogo";
import { SidebarNav } from "./molecules/SidebarNav";

export function Sidebar({ role }: { role: UserRole }) {
  const [expanded, setExpanded] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    timerRef.current = setTimeout(() => setExpanded(true), 1000);
  };

  const handleMouseLeave = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setExpanded(false);
  };

  return (
    <aside
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`fixed left-0 top-0 h-screen bg-white shadow-[0px_4px_10px_rgba(0,0,0,0.08)] flex flex-col items-center py-2 z-50 border-r border-[#F0F0F0] overflow-hidden transition-[width] duration-250 ease-in-out ${
        expanded ? "w-52" : "w-16 md:w-[102px]"
      }`}
    >
      <SidebarLogo />
      <div className="flex-1 w-full overflow-y-auto">
        <SidebarNav role={role} expanded={expanded} />
      </div>
      <LogoutButton />
    </aside>
  );
}
