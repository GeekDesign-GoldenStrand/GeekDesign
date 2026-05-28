"use client";

import { useEffect, useRef, useState } from "react";

import type { UserRole } from "@/types";

import { Sidebar } from "./Sidebar";
import { SidebarContext } from "./SidebarContext";

export function AdminShell({ role, children }: { role: UserRole; children: React.ReactNode }) {
  const [desktopExpanded, setDesktopExpanded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  function handleMouseEnter() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => setDesktopExpanded(true), 1000);
  }

  function handleMouseLeave() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setDesktopExpanded(false);
  }

  return (
    <SidebarContext.Provider
      value={{ desktopExpanded, mobileOpen, onMenuOpen: () => setMobileOpen(true) }}
    >
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <Sidebar
        role={role}
        expanded={desktopExpanded}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />

      <main
        className={`w-full bg-[#f5f5f5] min-h-screen transition-[padding-left] duration-250 ease-in-out pl-0 ${
          desktopExpanded ? "md:pl-52" : "md:pl-25.5"
        }`}
      >
        <div className="pt-[80px] md:pt-[118px]">{children}</div>
      </main>
    </SidebarContext.Provider>
  );
}
